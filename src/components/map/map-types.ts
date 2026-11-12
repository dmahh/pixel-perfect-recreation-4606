export type PinVariant =
  | "museum"
  | "park"
  | "monument"
  | "muted"
  | "stop"
  | "start"
  | "goal"
  | "open"
  | "closed"
  | "current"
  | "path"
  | "high"
  | "medium"
  | "low";

export type LineVariant = "edge" | "explored" | "route" | "walk";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  variant: PinVariant;
  text?: string;
}

export interface MapLine {
  id: string;
  points: [number, number][];
  variant: LineVariant;
}

export interface MapProps {
  markers: MapMarker[];
  lines?: MapLine[];
  /** Change this value to re-fit the map to the markers. */
  fitKey?: string;
  onMarkerClick?: (id: string) => void;
}
