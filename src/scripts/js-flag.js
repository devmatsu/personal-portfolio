// Lets CSS assume JavaScript from the first paint (e.g. the narrow-screen nav starts collapsed behind Menu)
// instead of waiting for the deferred module scripts, which would collapse it after paint and shift the page.
document.documentElement.setAttribute('data-js', '');
