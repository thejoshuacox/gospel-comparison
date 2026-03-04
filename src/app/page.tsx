import { ParallelReader } from "@/components/parallel-reader";
import { listEvents } from "@/lib/events";

export default function Home() {
  const events = listEvents({ limit: 200 }).items;

  return <ParallelReader events={events} />;
}
