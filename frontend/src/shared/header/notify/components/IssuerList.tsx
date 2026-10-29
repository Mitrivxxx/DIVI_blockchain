import type { IssuerApplicationListDto } from "../api/notifyApi";

interface NotifyListProps {
  pending: IssuerApplicationListDto[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export const NotifyList: React.FC<NotifyListProps> = ({ pending, onApprove, onReject }) => (
  <ul>
    {pending.map((item) => (
      <li key={item.id}>
        <b>{item.institutionName}</b> — {item.status}
        <br />
        Ethereum: {item.ethereumAddress}
        <br />
        <button type="button" onClick={() => onApprove(item.id)}>Akceptuj</button>{" "}
        <button type="button" onClick={() => onReject(item.id)}>Odrzuć</button>
      </li>
    ))}
  </ul>
);
