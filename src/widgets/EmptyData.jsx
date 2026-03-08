const defaultProps = {
  text: "Hozircha ma'lumot yo'q",
};

export default function EmptyData(props) {
  const mergedProps = { ...defaultProps, ...props };
  const { text } = mergedProps;
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex w-full max-w-xs flex-col items-center text-center select-none">
        <img
          className="pointer-events-none mb-5 size-40 object-center"
          src="/no-data.svg"
          alt=""
        />
        <p className="text-muted-foreground text-xs">{text}</p>
      </div>
    </div>
  );
}
