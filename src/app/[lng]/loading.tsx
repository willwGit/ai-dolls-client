export default function LoadingRender() {
  return (
    <div
      className={`transition-all duration-300 h-full flex items-center justify-center`}
    >
      <div className="flex items-end font-bold text-white">
        <span>Loading</span>
      </div>
    </div>
  );
}
