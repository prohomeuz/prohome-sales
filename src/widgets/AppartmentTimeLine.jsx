import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/widgets/reui/timeline";

const time = [
  {
    id: 1,
    date: "2024",
    title: "Qurilish boshlandi",
    description: "Xitoylik investorlar ishni boshlashdi",
  },
  {
    id: 2,
    date: "Hozir",
    title: "Jarayonda",
    description: "Wenny Estatening mohir ustalari maroq bilan ishlashmoqda",
  },
  {
    id: 3,
    date: "Dekabr 2026",
    title: "Kalit topshirish marosimi",
    description:
      "Barcha uylar kadastr hujjatlari bilan birgalikda topshiriladi",
  },
];

export default function ApparmentTimeLine() {
  return (
    <Timeline defaultValue={2} orientation="horizontal" className="w-full">
      {time.map((item) => (
        <TimelineItem
          key={item.id}
          step={item.id}
          className="group-data-[orientation=horizontal]/timeline:mt-0"
        >
          <TimelineHeader>
            <TimelineSeparator className="group-data-[orientation=horizontal]/timeline:top-8" />
            <TimelineDate className="mb-10 text-sm font-bold">
              {item.date}
            </TimelineDate>
            <TimelineTitle>{item.title}</TimelineTitle>
            <TimelineIndicator className="group-data-[orientation=horizontal]/timeline:top-8" />
          </TimelineHeader>
          <TimelineContent>{item.description}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
