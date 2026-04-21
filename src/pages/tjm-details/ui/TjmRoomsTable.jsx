import { cn, formatNumber } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { STATUS_CLASS, STATUS_LABEL } from "../lib/constants";

/**
 * @param {{
 *   rooms: Array<object>,
 *   activeDetailsId: string | null,
 *   onRoomClick: (id: string | number) => void,
 * }} props
 */
export default function TjmRoomsTable({ rooms, activeDetailsId, onRoomClick }) {
  if (!rooms.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="max-w-sm text-center">
          <h3 className="text-lg font-semibold">Uylar topilmadi</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Tanlangan filter va bloklar bo'yicha jadval ma'lumoti topilmadi.
          </p>
        </div>
      </div>
    );
  }

  const sortedRooms = [...rooms].sort((a, b) => {
    const blockCompare = String(a.blockName ?? "").localeCompare(
      String(b.blockName ?? ""),
      "uz",
    );
    if (blockCompare !== 0) return blockCompare;

    const floorCompare =
      Number(b.floorNumber ?? 0) - Number(a.floorNumber ?? 0);
    if (floorCompare !== 0) return floorCompare;

    return Number(a.houseNumber ?? 0) - Number(b.houseNumber ?? 0);
  });

  return (
    <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5"> 
      <div className="border-border/60 bg-background rounded-2xl border  ">
        <Table className="min-w-full table-auto">
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead>Blok</TableHead>
              <TableHead>Qavat</TableHead>
              <TableHead>Xonadon</TableHead>
              <TableHead>Xona</TableHead>
              <TableHead>Maydon</TableHead>
              <TableHead>Narx</TableHead>
              <TableHead className="w-px pr-6 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedRooms.map((room) => {
              const isActive = String(room.id) === activeDetailsId;

              return (
                <TableRow
                  key={room.id}
                  className={cn(
                    "cursor-pointer",
                    isActive && "bg-accent hover:bg-accent",
                  )}
                  onClick={() => onRoomClick(room.id)}
                >
                  <TableCell className="font-medium">
                    {room.blockName}
                  </TableCell>
                  <TableCell>{room.floorNumber}</TableCell>
                  <TableCell>#{room.houseNumber}</TableCell>
                  <TableCell>{room.room}x</TableCell>
                  <TableCell>{formatNumber(room.size)} m²</TableCell>
                  <TableCell>
                    {formatNumber(Math.round(room.totalPrice))} USD
                  </TableCell>
                  <TableCell className="w-px pr-6">
                    <div className="flex justify-end">
                      <Badge
                        className={cn(
                          "text-primary-foreground",
                          STATUS_CLASS[room.status],
                        )}
                      >
                        {STATUS_LABEL[room.status]}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
