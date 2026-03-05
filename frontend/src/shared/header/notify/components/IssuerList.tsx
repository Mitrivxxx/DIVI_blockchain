import type { IssuerApplicationListDto } from "../api/notifyApi";

interface NotifyListProps {
  pending: IssuerApplicationListDto[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const NotifyList: React.FC<NotifyListProps> = ({ pending, onApprove, onReject }) => (
  <ul>
    {pending.map((item) => (
      <li key={item.id}>
        <b>{item.institutionName}</b> - {item.status}<br />
        <span className="notify-eth">Ethereum: {item.ethereumAddress}</span>
        <button onClick={() => onApprove(item.id)}>Akceptuj</button>
        <button onClick={() => onReject(item.id)}>Odrzuć</button>
      </li>
    ))}
  </ul>
);
