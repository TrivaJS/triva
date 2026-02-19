res.send(`Hello World!`).setFavicon('./assets/web/favicon.png').type('image/png').size('32x32');

// HTML & Send exclusive options
res.html('<h1>Hello World!</h1>').setFavicon('./assets/web/favicon.png').type('image/png').size('32x32');
// OR
res.favicon('./assets/web/favicon.png').type('image/png').size('32x32');
res.setFavicon('./assets/web/favicon.png', {
  type: 'image/png',
  size: '32x32'
});

/*

  Plugin idea:

  Pager system, that sends a notification out to on-call engineers assigned via a seperate config file. Could be used for critical alerts, or errors that are caught by the handler.

*/