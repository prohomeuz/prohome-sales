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
    date: "Sentabr 2024",
    title: "Qurilish boshlandi",
    description: "200 ga yaqin jamoa bilan qurilishni boshladik.",
  },
  {
    id: 2,
    date: "Hozir",
    title: "Jarayonda",
    description: "Ustalarimiz maroq bilan ishlashmoqda",
  },
  {
    id: 3,
    date: "Dekabr 2027",
    title: "Kalit topshiriladi",
    description: "InshaAllah yangi uylarni hayrli qilsin",
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
            <TimelineDate className="mb-10 font-bold text-sm">
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
