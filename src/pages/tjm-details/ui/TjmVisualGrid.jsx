import { cn, formatNumber } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { STATUS_CLASS, STATUS_LABEL } from "../lib/constants";

/**
 * @param {{
 *   rooms: Array<object>,
 *   activeDetailsId: string | null,
 *   onRoomClick: (id: string | number) => void,
 *   showRoomCount: boolean,
 * }} props
 */
export default function TjmVisualGrid({
  rooms,
  activeDetailsId,
  onRoomClick,
  showRoomCount,
}) {
  if (!rooms.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-sm text-center">
          <h3 className="text-lg font-semibold">Uylar topilmadi</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Tanlangan filter va bloklar bo'yicha vizual ko'rinish topilmadi.
          </p>
        </div>
      </div>
    );
  }

  const groupedRooms = Object.entries(
    rooms.reduce((acc, room) => {
      const key = String(room.blockName ?? "Blok");
      acc[key] ??= [];
      acc[key].push(room);
      return acc;
    }, {}),
  );

  return (
    <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
      <div className="space-y-5">
        {groupedRooms.map(([blockName, blockRooms]) => (
          <section key={blockName} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">{blockName}</h3>
              <p className="text-muted-foreground text-xs">
                {formatNumber(blockRooms.length)} ta uy
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {blockRooms.map((room) => {
                const isActive = String(room.id) === activeDetailsId;

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => onRoomClick(room.id)}
                    className={cn(
                      "border-border/60 bg-background hover:border-primary/35 hover:bg-muted/20 flex flex-col gap-3 rounded-xl border p-4 text-left shadow-sm transition-colors",
                      isActive && "border-primary/45 bg-primary/[0.04]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-[11px] font-medium uppercase">
                          {room.floorNumber}-qavat
                        </p>
                        <p className="mt-1 truncate text-base font-semibold">
                          {showRoomCount
                            ? `${room.room}x`
                            : `#${room.houseNumber}`}
                        </p>
                      </div>

                      <Badge
                        className={cn(
                          "text-white border-none shadow-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase",
                          STATUS_CLASS[room.status],
                        )}
                      >
                        {STATUS_LABEL[room.status]}
                      </Badge>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-muted-foreground text-[11px]">
                          Xonadon
                        </dt>
                        <dd className="mt-1 font-medium">
                          #{room.houseNumber}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-[11px]">
                          Xonalar
                        </dt>
                        <dd className="mt-1 font-medium">{room.room}x</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-[11px]">
                          Maydon
                        </dt>
                        <dd className="mt-1 font-medium">
                          {formatNumber(room.size)} m²
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-[11px]">
                          Narx
                        </dt>
                        <dd className="mt-1 font-medium">
                          {formatNumber(Math.round(room.totalPrice))} USD
                        </dd>
                      </div>
                    </dl>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
