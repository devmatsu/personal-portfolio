// Page transition direction (styled in global.css): going deeper (index → widget/post) is "forward",
// coming back up is "backward"; between top-level pages no type is set, which gives the fade-through.
// Must run before first render, hence inline in <head>. Needs the Navigation API; without it, everything fades through.
addEventListener('pagereveal', function (event) {
  if (!event.viewTransition || !window.navigation || !navigation.activation || !navigation.activation.from) return;
  const depth = function (url) { return new URL(url).pathname.split('/').filter(Boolean).length > 1 ? 2 : 1; };
  const from = depth(navigation.activation.from.url);
  const to = depth(navigation.activation.entry.url);
  if (to > from) event.viewTransition.types.add('forward');
  else if (to < from) event.viewTransition.types.add('backward');
});
