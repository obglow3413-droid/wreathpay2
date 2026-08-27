
import type { Metadata } from "next";
import Link from "next/link";
import BackHeader from "@/components/layout/BackHeader";

export const metadata: Metadata = {
  title: "서비스소개",
  description: "꽃깞의 화환 순환관리 시스템: 회수부터 선별, 이력관리, 페이백까지.",
};

const RECOVERY_FLOW = [
  "행사장에 남은 화환을 정식 동의 후 회수",
  "실제 수량과 상태 확인",
  "생화·조화·화환대·부속 자재 구분",
  "재사용 가능 자원과 폐기 대상 분류",
  "재유통 대상에 고유 식별정보 부여",
  "매입처 인계 및 처리 결과 기록",
  "확인된 가치에 따른 페이백 정산",
];

const STEPS = [
  {
    no: "STEP 1",
    title: "회수등록",
    desc: "신청자가 행사 종류, 장소, 화환 종류와 수량을 등록합니다. 화환을 처분하거나 넘길 권한이 있는지 확인하고, 필요한 경우 행사장 또는 시설 담당자와 회수 일정을 조율합니다.",
  },
  {
    no: "STEP 2",
    title: "현장확인",
    desc: "수거 담당자가 실제 화환 수량과 상태를 확인합니다. 파손, 오염, 생화 상태, 화환대 형태와 부속품 등을 확인해 회수 가능한 자원과 처리 대상을 구분합니다.",
  },
  {
    no: "STEP 3",
    title: "자원판정",
    desc: "재사용 가능한 화환·부자재, 수리 후 활용 가능한 화환대, 조화 및 장식 자재, 파쇄·퇴비화 또는 폐기가 필요한 생화, 재사용이 어려운 자재로 분류합니다.",
  },
  {
    no: "STEP 4",
    title: "이력연결",
    desc: "재유통되는 대상에는 꽃깞의 고유 식별정보를 부여합니다. 해당 식별정보는 태그와 QR코드로 연결되며, 회수일·분류 결과·처리 상태와 유통 단계 등을 확인하는 데 사용됩니다.",
  },
  {
    no: "STEP 5",
    title: "가치정산",
    desc: "실제 수량과 상태, 매입 가능 여부와 수거 비용을 반영해 최종 페이백을 확정합니다. 회수 가치가 운송·처리 비용보다 낮은 경우에는 무료회수만 가능할 수 있습니다.",
  },
];

const TRACE_ITEMS = [
  "화환 또는 화환대 분류",
  "회수된 날짜",
  "상태 판정 결과",
  "재사용 가능 여부",
  "최근 확인 날짜",
  "처리 또는 인계 상태",
  "재사용 화환 표시 여부",
];

const TRACE_FLOW = ["회수 접수", "현장 확인", "선별 완료", "매입처 인계", "재유통 또는 자원처리 완료"];

const CLASSIFICATION_TABLE = [
  { label: "신규 제작", desc: "새로운 생화와 새로운 주요 자재로 제작" },
  { label: "재사용 화환", desc: "사용된 생화를 다시 활용한 화환" },
  { label: "화환대 재사용", desc: "기존 화환대를 선별·정비해 다시 활용" },
  { label: "부자재 순환", desc: "조화, 장식품 또는 일부 부속 자재 활용" },
  { label: "자원처리", desc: "재사용이 어려워 파쇄·퇴비화·폐기 등으로 처리" },
];

const BEFORE_ITEMS = [
  "접수 완료 여부",
  "방문 예정 일정",
  "수거 담당 배정 여부",
  "예상 수량",
  "예상 페이백 범위",
];

const AFTER_ITEMS = [
  "실제 회수 수량",
  "상태 확인 결과",
  "재사용 가능 자원 수량",
  "매입처 인계 여부",
  "최종 페이백 금액",
  "정산 완료 여부",
];

const PAYBACK_FACTORS = [
  "화환 종류와 실제 수량",
  "화환대와 부자재 상태",
  "재사용 또는 자원화 가능성",
  "수거지역과 이동거리",
  "차량과 작업 인력",
  "선별·보관·처리 비용",
  "매입처의 실제 인수 조건",
];

const PRINCIPLES = [
  { title: "동의 없이 가져가지 않습니다.", desc: "화환 회수 또는 처분 권한을 확인한 뒤 수거합니다." },
  {
    title: "재사용 사실을 숨기지 않습니다.",
    desc: "재사용 화환에 해당하면 관련 법령에 따른 표시와 고지가 필요합니다.",
  },
  {
    title: "모든 회수품을 다시 판매하지 않습니다.",
    desc: "상태 기준을 통과한 자원만 선별하고, 부적합한 자원은 별도 처리합니다.",
  },
  {
    title: "개인정보를 유통하지 않습니다.",
    desc: "리본에 표시된 성명과 회사명 등은 분리해 처리하며 QR에 개인정보를 노출하지 않습니다.",
  },
  {
    title: "회수 이후의 결과를 기록합니다.",
    desc: "접수부터 정산과 인계까지 주요 처리 단계를 이력으로 남깁니다.",
  },
];

const FAQ_ITEMS = [
  {
    q: "QR이 붙으면 모두 재사용 화환인가요?",
    a: "아닙니다. QR은 꽃깞의 회수·분류·이력정보를 연결하기 위한 수단입니다. QR 부착 여부와 법률상 재사용 화환 해당 여부는 같은 의미가 아닙니다.",
  },
  {
    q: "QR이 법정 재사용 화환 표시를 대신하나요?",
    a: "아닙니다. 재사용 화환에 요구되는 표시와 고지는 관련 법령의 기준에 맞게 별도로 이행해야 합니다. QR은 추가적인 이력정보를 제공하는 보조 수단입니다.",
  },
  {
    q: "누구나 QR 정보를 볼 수 있나요?",
    a: "공개용 정보는 누구나 확인할 수 있지만 개인정보와 민감한 거래정보는 표시하지 않습니다. 신청자용 상세정보는 본인 확인 후 별도로 제공합니다.",
  },
  {
    q: "회수한 화환은 전부 다시 사용하나요?",
    a: "아닙니다. 현장에서 수거한 뒤 상태를 확인하고 재사용, 수리, 부자재 활용, 자원처리 대상으로 나눕니다.",
  },
  {
    q: "리본에 적힌 이름은 어떻게 처리하나요?",
    a: "성명과 회사명이 표시된 리본은 분리해 처리합니다. 리본 정보는 QR 이력에 입력하지 않습니다.",
  },
  {
    q: "페이백 금액은 QR에서 공개되나요?",
    a: "개인의 정산금액은 공개 QR에 표시하지 않습니다. 신청자 본인만 접수 내역에서 확인할 수 있도록 구성합니다.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <BackHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border bg-white px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <h1 className="text-[28px] font-extrabold leading-[1.35] tracking-[-0.02em] text-foreground md:text-[38px] md:leading-[1.3]">
              한 번 쓰인 화환의
              <br />
              다음 경로까지 관리합니다.
            </h1>
            <p className="mt-5 text-[14.5px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[16px]">
              꽃깞은 행사가 끝난 화환을 회수하고 끝나는 서비스가 아닙니다.
              <br className="hidden md:block" />
              회수된 화환을 상태에 따라 분류하고, 다시 유통되는 화환에는 식별 태그와 QR 이력을
              연결합니다. 고객은 화환이 어떻게 회수되고 어떤 방식으로 처리됐는지 확인할 수 있으며,
              회수 과정에서 발생한 가치의 일부를 페이백으로 돌려받습니다.
            </p>
            <p className="mt-4 text-[14.5px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[16px]">
              결혼식·장례식·개업식·공연·기업행사까지, 화환이 사용되는 모든 장소를 하나의 투명한
              순환망으로 연결합니다.
            </p>

            <Link
              href="/estimate"
              className="hover-lift mt-7 flex h-13 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white md:inline-flex md:w-fit md:px-8"
            >
              내 화환 회수 가능 여부 확인하기
            </Link>
            <p className="mt-3 text-[12px] tracking-[-0.005em] text-muted-light">
              방문회수 · 상태판정 · QR 이력관리 · 페이백 정산
            </p>
          </div>
        </section>

        {/* 화환을 가져가는 것보다 */}
        <section className="border-b border-border bg-surface px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <h2 className="text-[22px] font-bold leading-[1.4] tracking-[-0.02em] text-foreground md:text-[28px]">
              화환을 가져가는 것보다
              <br />
              가져간 뒤가 더 중요합니다.
            </h2>
            <p className="mt-4 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              기존 화환 회수 시장은 사용이 끝난 화환이 어디로 이동하고, 어떤 상태로 다시 유통되는지
              확인하기 어려웠습니다. 이런 불투명한 구조에서는 새 화환과 다시 사용된 화환을
              소비자가 구분하기 어렵고, 화환을 맡긴 사람 역시 회수 이후의 처리 결과를 알 수
              없습니다.
            </p>
            <p className="mt-3 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              꽃깞은 이 문제를 해결하기 위해 화환의 회수부터 선별, 인계, 재유통까지 이어지는 과정을
              기록합니다.
            </p>
            <ul className="mt-6 space-y-2.5">
              {RECOVERY_FLOW.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-[13.5px] leading-relaxed tracking-[-0.005em] text-foreground md:text-[14.5px]"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 순환관리 시스템 5단계 */}
        <section className="border-b border-border bg-white px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[26px]">
              꽃깞 순환관리 시스템
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed tracking-[-0.005em] text-muted md:text-[15px]">
              꽃깞에 접수된 화환은 회수 가능 여부와 상태에 따라 각각 다른 경로로 이동합니다.
            </p>

            <div className="mt-7 space-y-5">
              {STEPS.map((step) => (
                <div key={step.no} className="rounded-2xl border border-border bg-surface p-5 md:p-6">
                  <span className="inline-block rounded-full bg-brand-tint px-2.5 py-1 text-[11px] font-bold tracking-wide text-brand-dark">
                    {step.no}
                  </span>
                  <p className="mt-2.5 text-[16px] font-bold tracking-[-0.015em] text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-[1.7] tracking-[-0.005em] text-muted md:text-[14.5px]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KKOT ID */}
        <section className="border-b border-border bg-surface px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <p className="text-[13px] font-bold tracking-wide text-brand-dark">KKOT ID</p>
            <h2 className="mt-1.5 text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[26px]">
              화환마다 하나의 순환 식별번호
            </h2>
            <p className="mt-4 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              꽃깞을 통해 다시 유통되는 대상에는 고유한{" "}
              <span className="font-semibold text-foreground">KKOT ID</span>가 부여됩니다.
            </p>
            <p className="mt-3 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              KKOT ID는 특정 화환 또는 화환대가 어느 회수 건에서 발생했고, 어떤 판정을 거쳐 어디로
              인계됐는지를 구분하기 위한 식별정보입니다. 동일한 화환이 반복적으로 유통되거나
              출처가 불명확해지는 문제를 줄이고, 매입처와 유통업체가 처리 이력을 구분할 수 있도록
              설계합니다.
            </p>
          </div>
        </section>

        {/* KKOT TAG */}
        <section className="border-b border-border bg-white px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <p className="text-[13px] font-bold tracking-wide text-brand-dark">KKOT TAG</p>
            <h2 className="mt-1.5 text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[26px]">
              재사용 여부를 숨기지 않는 표시
            </h2>
            <p className="mt-4 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              꽃깞 순환망을 통해 재유통되는 대상에는 상태와 용도에 맞는 식별 태그를 부착합니다.
              태그에는 다음 정보가 포함될 수 있습니다.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              {[
                "KKOT ID",
                "신규·재사용·부자재 재활용 등 분류",
                "최초 회수일",
                "최근 상태 확인일",
                "QR코드",
                "취급 및 표시 안내",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] tracking-[-0.005em] text-foreground"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl bg-surface p-4">
              <p className="text-[13px] leading-[1.7] tracking-[-0.005em] text-muted">
                생화를 재사용한 화환을 판매하거나 판매 목적으로 제작·보관·진열하는 경우에는
                「화훼산업 발전 및 화훼문화 진흥에 관한 법률」에 따라 해당 제품이 재사용 화환임을
                표시하고 소비자와 유통업자에게 고지해야 합니다.
              </p>
              <p className="mt-2.5 text-[13px] leading-[1.7] tracking-[-0.005em] text-muted">
                꽃깞의 태그와 QR 시스템은 이러한 법정 표시를 없애거나 대체하기 위한 것이 아닙니다.
                법령상 필요한 재사용 화환 표시를 준수하면서, 회수와 유통에 관한 추가 정보를
                제공하기 위한 보조 이력관리 수단입니다.
              </p>
            </div>
          </div>
        </section>

        {/* KKOT TRACE */}
        <section className="border-b border-border bg-surface px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <p className="text-[13px] font-bold tracking-wide text-brand-dark">KKOT TRACE</p>
            <h2 className="mt-1.5 text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[26px]">
              QR을 열면 이동 경로가 보입니다.
            </h2>
            <p className="mt-4 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              태그의 QR코드를 스캔하면 해당 식별정보에 연결된 순환 기록을 확인할 수 있습니다.
              공개 범위에서는 개인정보나 행사 참석자의 이름을 노출하지 않고 다음과 같은 정보만
              제공합니다.
            </p>
            <ul className="mt-4 space-y-2">
              {TRACE_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-[13.5px] tracking-[-0.005em] text-foreground md:text-[14.5px]"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-relaxed tracking-[-0.005em] text-muted-light">
              신청자의 이름, 연락처, 계좌번호, 행사 세부정보와 같은 개인정보는 QR 화면에 표시하지
              않습니다.
            </p>

            {/* 처리 단계 흐름 */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {TRACE_FLOW.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-white px-3 py-1.5 text-[12px] font-medium tracking-[-0.005em] text-foreground">
                    {step}
                  </span>
                  {i < TRACE_FLOW.length - 1 && <span className="text-muted-light">→</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 신규 vs 재사용 구분 테이블 */}
        <section className="border-b border-border bg-white px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <h2 className="text-[20px] font-bold leading-[1.4] tracking-[-0.02em] text-foreground md:text-[26px]">
              새 화환과 재사용 화환을
              <br />
              명확하게 구분합니다.
            </h2>
            <p className="mt-4 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              꽃깞은 모든 회수 화환을 재사용 화환으로 분류하지 않습니다. 현행 화훼산업법에서 말하는
              재사용 화환은 생화를 재사용한 화환을 의미합니다. 단순히 사용했던 화환대나 부속
              자재를 활용하고 새로운 꽃으로 제작한 경우와는 법률상 판단이 다를 수 있습니다.
            </p>
            <p className="mt-3 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              따라서 꽃깞은 회수된 자원을 다음과 같이 구분해 기록합니다.
            </p>

            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-[13px] md:text-[14px]">
                <thead className="bg-surface text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">구분</th>
                    <th className="px-4 py-2.5 font-medium">의미</th>
                  </tr>
                </thead>
                <tbody>
                  {CLASSIFICATION_TABLE.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <td className="px-4 py-3 font-semibold tracking-[-0.01em] text-foreground">
                        {row.label}
                      </td>
                      <td className="px-4 py-3 tracking-[-0.005em] text-muted">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed tracking-[-0.005em] text-muted-light">
              재사용 화환에 해당하는 경우에는 법정 표시 기준을 준수해야 하며, 꽃깞 QR에는 관련
              분류정보를 추가로 연결합니다.
            </p>
          </div>
        </section>

        {/* 신청자 확인 정보 */}
        <section className="border-b border-border bg-surface px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[26px]">
              신청자가 확인할 수 있는 정보
            </h2>
            <p className="mt-3 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              꽃깞에 화환 회수를 맡긴 신청자는 접수번호를 통해 처리 진행 상황을 확인할 수 있습니다.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="text-[14px] font-bold text-foreground">회수 전</p>
                <ul className="mt-3 space-y-2">
                  {BEFORE_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] tracking-[-0.005em] text-muted">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-brand/30 bg-white p-5">
                <p className="text-[14px] font-bold text-brand-dark">회수 후</p>
                <ul className="mt-3 space-y-2">
                  {AFTER_ITEMS.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] tracking-[-0.005em] text-muted">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed tracking-[-0.005em] text-muted-light">
              모든 세부 유통정보를 공개하는 것은 아닙니다. 개인정보, 거래처 영업정보와 개별
              매입가격 등은 보호하고, 신청자가 자신의 화환 처리 결과를 확인하는 데 필요한 범위만
              제공합니다.
            </p>
          </div>
        </section>

        {/* 페이백 안내 */}
        <section className="border-b border-border bg-white px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[26px]">
              페이백은 판매대금 전체가 아닙니다.
            </h2>
            <p className="mt-4 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              화환에서 발생한 모든 금액이 고객에게 그대로 지급되는 것은 아닙니다. 최종 페이백은
              다음 항목을 반영해 계산합니다.
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              {PAYBACK_FACTORS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[13px] tracking-[-0.005em] text-foreground"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13.5px] leading-[1.75] tracking-[-0.005em] text-muted">
              회수 가치가 비용보다 높은 경우에는 일부를 고객에게 페이백합니다. 비용과 가치가 비슷한
              경우에는 금액 없이 무료회수만 제공될 수 있으며, 수거 자체가 어려운 경우에는 접수
              단계에서 미리 안내합니다.
            </p>
          </div>
        </section>

        {/* 원칙 */}
        <section className="border-b border-border bg-surface px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[26px]">
              꽃깞이 만들려는 기준
            </h2>
            <p className="mt-3 text-[14px] leading-[1.75] tracking-[-0.005em] text-muted md:text-[15.5px]">
              화환의 재사용 자체가 문제가 되는 것은 아닙니다. 문제는 재사용 사실을 숨기거나, 새
              화환으로 오인하게 만들거나, 회수 이후의 경로를 아무도 확인할 수 없는 유통구조입니다.
              꽃깞은 다음 원칙으로 화환 순환시장을 운영합니다.
            </p>
            <div className="mt-6 space-y-3">
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="rounded-xl border border-border bg-white p-4">
                  <p className="text-[14px] font-bold tracking-[-0.01em] text-foreground">{p.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed tracking-[-0.005em] text-muted">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-border bg-white px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px]">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[26px]">
              자주 묻는 질문
            </h2>
            <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q} className="px-5 py-4">
                  <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-foreground md:text-[14.5px]">
                    {item.q}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-[1.7] tracking-[-0.005em] text-muted md:text-[14px]">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 마무리 CTA */}
        <section className="bg-foreground px-5 py-14 text-white md:px-8 md:py-20">
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="text-[22px] font-extrabold leading-[1.4] tracking-[-0.02em] md:text-[30px]">
              화환을 버리는 과정에서
              <br />
              확인 가능한 순환으로.
            </h2>
            <p className="mx-auto mt-4 max-w-[520px] text-[14px] leading-[1.75] tracking-[-0.005em] text-white/70 md:text-[15.5px]">
              꽃깞은 화환을 단순히 가져가는 서비스에서 멈추지 않습니다. 누가 회수를 요청했고, 어떤
              상태로 확인됐으며, 재사용 가능한 자원이 어디로 이동했는지를 기록합니다. 투명하게
              회수하고, 구분해서 유통하고, 확인된 가치를 정산합니다.
            </p>
            <Link
              href="/estimate"
              className="hover-lift mt-7 inline-flex h-13 items-center justify-center rounded-xl bg-brand px-8 text-[15px] font-semibold text-white"
            >
              화환 회수 신청하기
            </Link>
            <p className="mt-3 text-[12px] tracking-[-0.005em] text-white/50">
              권한 확인 · 방문회수 · QR 이력관리 · 페이백 정산
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
