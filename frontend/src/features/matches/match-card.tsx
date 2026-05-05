export interface MatchCardProps {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  status: string;
}

export const MatchCard = ({ homeTeam, awayTeam, date, status }: MatchCardProps) => (
  <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center">
      <span className="font-semibold">{homeTeam}</span>
      <span className="text-xs text-muted-foreground">{status}</span>
      <span className="font-semibold">{awayTeam}</span>
    </div>
    <div className="text-center text-sm text-muted-foreground mt-2">{date}</div>
  </div>
);
