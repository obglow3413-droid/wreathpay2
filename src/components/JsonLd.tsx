/** 검색엔진용 구조화 데이터 삽입. 값은 모두 코드·DB에서 만든 것이며 '<' 는 이스케이프한다. */
export default function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
