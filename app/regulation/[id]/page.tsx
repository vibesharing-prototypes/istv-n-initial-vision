import { regulations } from '../../data/regulations';
import RegulationDetailClient from './RegulationDetailClient';

export function generateStaticParams() {
  return regulations.map((r) => ({ id: r.id }));
}

export default function RegulationDetailPage({ params }: { params: { id: string } }) {
  return <RegulationDetailClient id={params.id} />;
}
