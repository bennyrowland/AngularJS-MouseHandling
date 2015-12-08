
angular.module('dragging', ['mouseCapture', ] )

		//
		// Service used to help with dragging and clicking on elements.
		//
		.factory('dragging', ['$rootScope', 'mouseCapture',function ($rootScope, mouseCapture) {

			//
			// Threshold for dragging.
			// When the mouse moves by at least this amount dragging starts.
			//
			var threshold = 5;

			return {


				//
				// Called by users of the service to register a mousedown event and start dragging.
				// Acquires the 'mouse capture' until the mouseup event.
				//
				startDrag: function (evt, config) {

					var dragging = false;
					var x = evt.pageX;
					var y = evt.pageY;

					//
					// Handler for mousemove events while the mouse is 'captured'.
					//
					var mouseMove = function (evt) {

						if (!dragging) {
							if (Math.abs(evt.pageX - x) > threshold ||
									Math.abs(evt.pageY - y) > threshold)
							{
								dragging = true;

								if (config.dragStarted) {
									config.dragStarted(x, y, evt);
								}

								if (config.dragging) {
									// First 'dragging' call to take into account that we have
									// already moved the mouse by a 'threshold' amount.
									config.dragging(evt.pageX, evt.pageY, evt);
								}
							}
						}
						else {
							if (config.dragging) {
								config.dragging(evt.pageX, evt.pageY, evt);
							}

							x = evt.pageX;
							y = evt.pageY;
						}
					};

					//
					// Handler for when mouse capture is released.
					//
					var released = function() {

						if (dragging) {
							if (config.dragEnded) {
								config.dragEnded();
							}
						}
						else {
							if (config.clicked) {
								config.clicked();
							}
						}
					};

					//
					// Handler for mouseup event while the mouse is 'captured'.
					// Mouseup releases the mouse capture.
					//
					var mouseUp = function (evt) {

						mouseCapture.release();

						evt.stopPropagation();
						evt.preventDefault();
					};

					//
					// Acquire the mouse capture and start handling mouse events.
					//
					mouseCapture.acquire(evt, {
						mouseMove: mouseMove,
						mouseUp: mouseUp,
						released: released
					});

					evt.stopPropagation();
					evt.preventDefault();
				}

			};

		}]);

angular.module('mouseCapture', [])

		//
		// Service used to acquire 'mouse capture' then receive dragging events while the mouse is captured.
		//
		.factory('mouseCapture', [ '$rootScope', function ($rootScope) {

					//
					// Element that the mouse capture applies to, defaults to 'document'
					// unless the 'mouse-capture' directive is used.
					//
					var $element = document;

					//
					// Set when mouse capture is acquired to an object that contains
					// handlers for 'mousemove' and 'mouseup' events.
					//
					var mouseCaptureConfig = null;

					//
					// Handler for mousemove events while the mouse is 'captured'.
					//
					var mouseMove = function (evt) {

						if (mouseCaptureConfig && mouseCaptureConfig.mouseMove) {

							mouseCaptureConfig.mouseMove(evt);

							$rootScope.$digest();
						}
					};

					//
					// Handler for mouseup event while the mouse is 'captured'.
					//
					var mouseUp = function (evt) {

						if (mouseCaptureConfig && mouseCaptureConfig.mouseUp) {

							mouseCaptureConfig.mouseUp(evt);

							$rootScope.$digest();
						}
					};

					return {

						//
						// Register an element to use as the mouse capture element instead of
						// the default which is the document.
						//
						registerElement: function(element) {

							$element = element;
						},

						//
						// Acquire the 'mouse capture'.
						// After acquiring the mouse capture mousemove and mouseup events will be
						// forwarded to callbacks in 'config'.
						//
						acquire: function (evt, config) {

							//
							// Release any prior mouse capture.
							//
							this.release();

							mouseCaptureConfig = config;

							//
							// In response to the mousedown event register handlers for mousemove and mouseup
							// during 'mouse capture'.
							//
							$element.on("mousemove", mouseMove);
							$element.on("mouseup", mouseUp);
						},

						//
						// Release the 'mouse capture'.
						//
						release: function () {

							if (mouseCaptureConfig) {

								if (mouseCaptureConfig.released) {
									//
									// Let the client know that their 'mouse capture' has been released.
									//
									mouseCaptureConfig.released();
								}

								mouseCaptureConfig = null;
							}

							$element.unbind("mousemove", mouseMove);
							$element.unbind("mouseup", mouseUp);
						},
					};
				}]
		)

		//
		// Directive that marks the mouse capture element.
		//
		.directive('mouseCapture', function () {
			return {
				restrict: 'A',

				controller: ['$scope', '$element', '$attrs', 'mouseCapture',
					function($scope, $element, $attrs, mouseCapture) {

						//
						// Register the directives element as the mouse capture element.
						//
						mouseCapture.registerElement($element);

					}],

			};
		})
;