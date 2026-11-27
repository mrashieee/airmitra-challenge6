/** "Elamkulam, Malappuram - Kerala ELWOIC" -> "Elamkulam" */
export function shortStationName(name: string): string {
  return name.split(" - ")[0].trim();
}
