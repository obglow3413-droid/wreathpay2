import type { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/config";
import DriverJobs, { type Job } from "./DriverJobs";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "기사님 수거 목록", robots: { index: false, follow: false } };

const OPEN = ["customer_approved", "dispatch_pending", "dispatched", "collecting"];

export default async function DriverPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let driverName: string | null = null;
  let jobs: Job[] = [];

  if (isServiceRoleConfigured() && token.length >= 16) {
    try {
      const svc = await createServiceRoleClient();
      const { data: driver } = await svc.from("drivers").select("id, name, is_active").eq("access_token", token).maybeSingle();
      if (driver?.is_active) {
        driverName = driver.name;
        const { data } = await svc
          .from("pickup_orders")
          .select(
            "estimate_request_id, estimate_requests!inner(id, request_no, status, place_name, address, address_detail, pickup_date, pickup_time_slot, quantity_range, customer_note, customers(name, phone))"
          )
          .eq("driver_id", driver.id)
          .in("estimate_requests.status", OPEN);
        jobs = (data ?? [])
          .map((row) => {
            const r = Array.isArray(row.estimate_requests) ? row.estimate_requests[0] : row.estimate_requests;
            const c = r && (Array.isArray(r.customers) ? r.customers[0] : r.customers);
            return r
              ? ({
                  id: r.id,
                  requestNo: r.request_no,
                  status: r.status,
                  place: r.place_name,
                  address: r.address,
                  detail: r.address_detail,
                  date: r.pickup_date,
                  slot: r.pickup_time_slot,
                  quantity: r.quantity_range,
                  note: r.customer_note,
                  name: c?.name ?? "",
                  phone: c?.phone ?? "",
                } as Job)
              : null;
          })
          .filter((j): j is Job => j !== null)
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    } catch (e) {
      console.error("[driver page]", e);
    }
  }

  if (!driverName) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-[16px] font-bold">유효하지 않은 링크예요</p>
        <p className="mt-2 text-[13.5px] text-muted">담당자에게 기사 전용 링크를 다시 요청해 주세요.</p>
      </div>
    );
  }

  return <DriverJobs token={token} driverName={driverName} jobs={jobs} />;
}
