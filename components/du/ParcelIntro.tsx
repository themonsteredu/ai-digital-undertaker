import ParcelPaper from './ParcelPaper';

// Reuse the investigation documents, aligned with the blank papers in the photo.
export default function ParcelIntro() {
  return <svg viewBox="0 0 1448 1086" className="parcel-intro" role="img" aria-label="송장이 붙은 택배 상자와 구매 영수증">
    <image href="/art/scene-parcel.png" width="1448" height="1086" />
    <foreignObject width="1000" height="690" transform="matrix(.354 .128 -.193 .31 573 238)">
      <ParcelPaper document="label" />
    </foreignObject>
    <foreignObject width="600" height="960" transform="matrix(.252 .078 -.18 .4 1136 534)">
      <ParcelPaper document="receipt" />
    </foreignObject>
  </svg>;
}
