export default function LogoLoader() {
  return (
    <div className="bg-background absolute inset-0 z-40 flex h-full w-full items-center justify-center">
      <div className="flex animate-pulse items-center gap-4">
        <img className="h-20 w-20" src="/logo.png" aria-hidden={true} />
        <h2 className="text-xl font-medium">PROHOME</h2>
      </div>
    </div>
  )
}
