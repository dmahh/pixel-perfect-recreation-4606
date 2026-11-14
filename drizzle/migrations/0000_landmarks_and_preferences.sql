CREATE TABLE public.landmarks (
  id text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('museum','park','monument')),
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  cost integer NOT NULL DEFAULT 0,
  visit_hours numeric NOT NULL,
  interests text[] NOT NULL DEFAULT '{}',
  setting text NOT NULL CHECK (setting IN ('indoor','outdoor','mixed')),
  rating numeric NOT NULL,
  popularity integer NOT NULL CHECK (popularity BETWEEN 0 AND 100),
  description text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.landmarks TO anon, authenticated;
GRANT ALL ON public.landmarks TO service_role;
ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Landmarks are public" ON public.landmarks FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.landmarks (id,name,short_name,category,lat,lng,cost,visit_hours,interests,setting,rating,popularity,description,sort_order) VALUES
('bayterek','Bayterek Tower','Bayterek','monument',51.1283,71.4305,2000,1,'{architecture,photography,history}','mixed',4.8,98,'A 97-metre ''tree of life'' holding a golden egg. The observation deck height marks 1997, the year Astana became the capital.',1),
('khan-shatyr','Khan Shatyr Entertainment Center','Khan Shatyr','monument',51.1325,71.4039,6000,1.5,'{shopping,architecture,photography}','indoor',4.6,92,'Norman Foster''s 150-metre transparent tent, home to shops, an indoor park and a rooftop beach resort.',2),
('palace-peace','Palace of Peace and Reconciliation','Pyramid','monument',51.1231,71.4635,2500,1,'{architecture,culture,spirituality}','indoor',4.7,80,'A 62-metre glass pyramid built to host the Congress of Leaders of World and Traditional Religions.',3),
('hazrat-sultan','Hazrat Sultan Mosque','Hazrat Sultan','monument',51.1254,71.4721,0,0.75,'{spirituality,architecture,culture}','indoor',4.8,85,'One of the largest mosques in Central Asia, built in classical Islamic style with traditional Kazakh ornament.',4),
('national-museum','National Museum of Kazakhstan','National Museum','museum',51.1182,71.4694,1500,2,'{history,culture}','indoor',4.8,82,'The largest museum in Central Asia: the Golden Man hall, ethnography and the story of independent Kazakhstan.',5),
('nur-alem','Nur Alem — Museum of Future Energy','Nur Alem','museum',51.0892,71.4162,3500,1.5,'{science,architecture,photography}','indoor',4.7,88,'The 100-metre glass sphere built for EXPO-2017, with eight floors on renewable and future energy.',6),
('atameken','Atameken Ethno-Memorial Complex','Atameken','museum',51.1493,71.4175,1000,1,'{history,culture,nature}','outdoor',4.3,60,'An open-air map of Kazakhstan in miniature, with models of landmarks from every region of the country.',7),
('central-park','Astana Central Park','Central Park','park',51.1549,71.419,0,1,'{nature,photography}','outdoor',4.5,75,'A riverside park on the right bank of the Esil with a long promenade, lawns and a family amusement area.',8),
('presidential-park','Presidential Park','Presidential Park','park',51.1135,71.4443,0,1,'{nature,photography}','outdoor',4.6,70,'Wide landscaped park on the left bank with lakes, walking loops and views of Ak Orda and the Pyramid.',9),
('botanical-garden','Astana Botanical Garden','Botanical Garden','park',51.1075,71.4171,1000,1.25,'{nature,science,photography}','mixed',4.5,72,'Gardens with more than a thousand plant species and a tropical greenhouse, a short walk from Khan Shatyr.',10);

CREATE TABLE public.tourist_preferences (
  device_token text PRIMARY KEY CHECK (char_length(device_token) BETWEEN 32 AND 64),
  budget integer NOT NULL CHECK (budget BETWEEN 0 AND 1000000),
  hours numeric NOT NULL CHECK (hours BETWEEN 0.5 AND 24),
  interests text[] NOT NULL DEFAULT '{}',
  start_id text NOT NULL DEFAULT 'left-bank',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.tourist_preferences TO service_role;
ALTER TABLE public.tourist_preferences ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.get_tourist_preferences(_device_token text)
RETURNS SETOF public.tourist_preferences
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.tourist_preferences WHERE device_token = _device_token;
$$;

CREATE FUNCTION public.save_tourist_preferences(_device_token text, _budget integer, _hours numeric, _interests text[], _start_id text)
RETURNS public.tourist_preferences
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.tourist_preferences;
BEGIN
  IF NOT (_interests <@ ARRAY['history','architecture','nature','culture','science','shopping','photography','spirituality']) THEN
    RAISE EXCEPTION 'Invalid interests';
  END IF;
  INSERT INTO public.tourist_preferences (device_token,budget,hours,interests,start_id,updated_at)
  VALUES (_device_token,_budget,_hours,_interests,left(_start_id,40),now())
  ON CONFLICT (device_token) DO UPDATE SET budget=EXCLUDED.budget, hours=EXCLUDED.hours,
    interests=EXCLUDED.interests, start_id=EXCLUDED.start_id, updated_at=now()
  RETURNING * INTO r;
  RETURN r;
END $$;

REVOKE ALL ON FUNCTION public.get_tourist_preferences(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_tourist_preferences(text,integer,numeric,text[],text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tourist_preferences(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_tourist_preferences(text,integer,numeric,text[],text) TO anon, authenticated;