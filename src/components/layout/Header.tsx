import { Bell, Search } from "lucide-react";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-8">
      {/* Mobile: App Name | Desktop: Search */}
      <div className="flex flex-1 items-center gap-3">
        <h1 className="font-serif text-xl font-semibold tracking-wide text-foreground md:hidden">
          LetitiAPP
        </h1>
        <div className="relative w-full max-w-md hidden md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-foreground bg-transparent ring-1 ring-inset ring-border placeholder:text-muted focus:ring-2 focus:ring-inset focus:ring-letitia-gold sm:text-sm sm:leading-6"
            placeholder="Buscar (Cmd+K)..."
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile search icon */}
        <button className="md:hidden relative p-2 text-muted hover:text-foreground transition-colors">
          <Search className="h-5 w-5" />
        </button>
        <button className="relative p-2 text-muted hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-letitia-clay ring-2 ring-background" />
        </button>
      </div>
    </header>
  );
}
