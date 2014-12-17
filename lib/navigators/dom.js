/**
 * The DomNavigator is responsible for navigation between components, both via
 * a top-level DOM `click` event handler and on-request.
 */
var DomRenderer = require('../renderers/dom');
var when = require('when');

/**
 * Creates a new instance of DomNavigator with the provided `options`.
 *
 *  - `router`: A valid Router instance. Required.
 *  - `context`: A valid Context instance. If provided, this Context will be
 *      rehydrated with any state provided from upstream Renderers provided a
 *      similar Context. Recommended.
 */
function DomNavigator(options) {
  if (!(this instanceof DomNavigator)) {
    return new DomNavigator(options);
  }

  options = options || {};

  this.renderer = this.renderer || options.renderer || new DomRenderer(options);
  this.router = options.router || null;
  this.context = options.context || null;

  if (!this.renderer) {
    throw new Error('Missing a valid renderer.');
  }

  if (!this.router) {
    throw new Error('Missing a valid router.');
  }
}
DomNavigator.createNavigator = DomNavigator;

/**
 * Navigates to the given `location`, represented as either a String href or
 * Location object.
 */
DomNavigator.prototype.navigate = function navigate(location, perform) {
  var self = this;

  if (!self.router.isSameDomain(location, global.location)) {
    console.log('DIFFERENT DOMAIN:', location, String(global.location));
    return;
  }

  var route = self.router.getRoute(location);
  var promise;

  if (!route) {
    route = self.router.getErrorRoute(404);
  }

  if (!route) {
    return next(new Error('No route found, and no 404 page provided.'));
  }

  if (!route.body) {
    return next(new Error('No body component found.'));
  }

  if (perform && route.action && self.context) {
    promise = self.context.performAction(route.action, route.params);
  }

  return when(promise)
    .then(function () {
      var props = {
        route: route,
        context: self.context
      };

      self.renderer.render(route.body(props), document.body);

      document.title = self.getTitle(props) || document.title;
      global.history.pushState(null, '', location);
    });
};

/**
 * Handles anchor navigation as a result of `event` ClickEvent by triggering
 * a re-render. All other `click` events pass through, unharmed.
 */
DomNavigator.prototype.onClick = function onClick(event) {
  var self = this;

  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
    return;
  }

  function search(element) {
    if (!element) {
      return;
    }

    if (element.href) {
      return navigate(element.href);
    }

    search(element.parentElement);
  }

  function navigate(location) {
    event.preventDefault();

    self.navigate(location, true);
  }

  search(event.target);
};

/**
 * Calculates the expected title based on the `props`. The included route's
 * `title` property, either a String or a Function, is used for the calculation.
 * If a Function, the `props` themselves are passed in.
 */
DomNavigator.prototype.getTitle = function getTitle(props) {
  var title = props.route.title;

  if (typeof title === 'function') {
    title = title(props);
  }

  return String(title);
};

/**
 * Installs the necessary event handlers in the browser.
 */
DomNavigator.prototype.start = function start() {
  var self = this;

  // Rehydrate the Context first and once.
  if (self.context) {
    self.context.fromObject(global.LITTLEST_ISOMORPH_CONTEXT);
  }

  // When the Back button is pressed, we need to rehydrate based on state
  // stored by the browser-stored.
  global.onpopstate = function () {
    self.navigate(global.location, true);
  };

  // When the DOM initially loads, we need to rehydrate based on state provided
  // by the server.
  global.document.addEventListener('DOMContentLoaded', function () {
    self.navigate(global.location, false);
  });

  // Navigation is done through a top-level click handler, so attach that.
  global.document.addEventListener('click', function onClick(event) {
    self.onClick(event);
  });
};

/*!
 * Export `DomNavigator`.
 */
module.exports = DomNavigator;