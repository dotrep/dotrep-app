// Scale the 1440x900 design surface uniformly to fit the viewport
(function(){
  const stage = document.getElementById('stage');
  const W = parseFloat(stage.dataset.w);
  const H = parseFloat(stage.dataset.h);

  // we apply a transform to the *children* so absolute coordinates stay 1:1
  const applyScale = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = Math.min(vw / W, vh / H);

    // set stage size so positioned children have natural coords,
    // and scale all children as a group.
    stage.style.width  = W + 'px';
    stage.style.height = H + 'px';
    for (const el of Array.from(stage.children)) {
      el.style.transform = `scale(${s})`;
    }

    // center the scaled content
    stage.style.transform = `translate(${(vw - W*s)/2}px, ${(vh - H*s)/2}px)`;
    stage.style.transformOrigin = '0 0';
  };

  window.addEventListener('resize', applyScale, {passive:true});
  applyScale();
})();
