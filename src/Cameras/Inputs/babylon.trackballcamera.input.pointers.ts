function PrintDebug(s) {
    var elem = document.getElementById("DaveDebug");
    elem.innerHTML = "<p>"+s+"</p>";
}



module BABYLON {
    var eventPrefix = Tools.GetPointerPrefix();

    export class TrackballCameraPointersInput implements ICameraInput<TrackballCamera> {
        camera: TrackballCamera;

        //@serialize()
        //public angularSensibilityX = 1000.0;

        //@serialize()
        //public angularSensibilityY = 1000.0;

        //@serialize()
        //public pinchPrecision = 6.0;

        //@serialize()
        //public panningSensibility: number = 50.0;

        private _isRotating: boolean = false;
        private _isPanning:  boolean = false;
        private _isZooming:  boolean = false;

        private _prevX: number = undefined;
        private _prevY: number = undefined;
        //public pinchInwards = true;

        private _pointerInput: (p: PointerInfo, s: EventState) => void;
        private _observer: Observer<PointerInfo>;
        private _onKeyDown: (e: KeyboardEvent) => any;
        private _onKeyUp: (e: KeyboardEvent) => any;
        private _onMouseMove: (e: MouseEvent) => any;
        private _onGestureStart: (e: PointerEvent) => void;
        private _onGesture: (e: MSGestureEvent) => void;
        private _MSGestureHandler: MSGesture;
        private _onLostFocus: (e: FocusEvent) => any;
        private _onContextMenu: (e: PointerEvent) => void;

        public attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            var engine = this.camera.getEngine();
            //var cacheSoloPointer: { x: number, y: number, pointerId: number, type: any }; // cache pointer object for better perf on camera rotation
            //var pointA: { x: number, y: number, pointerId: number, type: any }; //, pointB: { x: number, y: number, pointerId: number, type: any };
            //var previousPinchDistance = 0;

            this._pointerInput = (p, s) => {
                var evt = <PointerEvent>p.event;
                if (p.type === PointerEventTypes.POINTERDOWN) {
                    try {
                        evt.srcElement.setPointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error. Execution will continue.
                    }


                    // Manage panning with pan button click
                    //this._isPanClick = evt.button === this.camera._panningMouseButton;

                    this._isPanning = true;
                    this._prevX = evt.clientX;
                    this._prevY = evt.clientY;
                    

                    // manage pointers
                    //cacheSoloPointer = { x: evt.clientX, y: evt.clientY, pointerId: evt.pointerId, type: evt.pointerType };
                    //if (pointA === undefined) {
                    //    pointA = cacheSoloPointer;
                    //}
                    //else if (pointB === undefined) {
                    //    pointB = cacheSoloPointer;
                    //}
                    if (!noPreventDefault) {
                        evt.preventDefault();
                        element.focus();
                    }
                } else if (p.type === PointerEventTypes.POINTERUP) {
                    try {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                    } catch (e) {
                        //Nothing to do with the error.
                    }

                    //cacheSoloPointer = null;
                    //previousPinchDistance = 0;

                    //would be better to use pointers.remove(evt.pointerId) for multitouch gestures, 
                    //but emptying completly pointers collection is required to fix a bug on iPhone : 
                    //when changing orientation while pinching camera, one pointer stay pressed forever if we don't release all pointers  
                    //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                    this._prevX = undefined;
                    this._prevY = undefined;
                    this._isRotating = false;
                    this._isPanning  = false;
                    this._isZooming  = false;

                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                } else if (p.type === PointerEventTypes.POINTERMOVE) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }

                    // One button down
                    //if (pointA && pointB === undefined) {
                    if (this._isRotating || this._isPanning || this._isZooming) {   
                        if (this._isRotating) {


                        } else if (this._isPanning) {
                            // Intersect rays with a plane through the target point, 
                            //var prevDistW = (2.0 * this._prevPointA.x / engine.getRenderWidth() - 1.0) * this.camera._getScreenWidth();
                            //var prevDistH = (2.0 * this._prevPointA.y / engine.getRenderHeight() - 1.0) * this.camera._getScreenHeight();

                            //var curDistW = (2.0 * evt.clientX / engine.getRenderWidth() - 1.0) * this.camera._getScreenWidth();
                            //var curDistH = (2.0 * evt.clientY / engine.getRenderHeight() - 1.0) * this.camera._getScreenHeight();
                            PrintDebug(evt.clientX.toString(10) + ", " + evt.clientY.toString(10));
                            var rightVec = Vector3.Cross(this.camera.upVector, this.camera.position.subtract(this.camera.target)).normalize();

                            //var newPoint = this.camera.target.add( rightVec.scale(prevDistW) ).add( this.camera.upVector.scale(prevDistH) );
                            var offset = rightVec.scale(                   ((evt.clientX - this._prevX) / engine.getRenderWidth())  * 2.0 * this.camera._getScreenWidth()  ); 
                            offset.addInPlace( this.camera.upVector.scale( ((evt.clientY - this._prevY) / engine.getRenderHeight()) * 2.0 * this.camera._getScreenHeight() ) );

                            this.camera.position.addInPlace(offset);
                            this.camera.target.addInPlace(offset);

                        } else if (this._isZooming) {


                        }
                        /*if (this.panningSensibility !== 0 &&
                            ((evt.ctrlKey && this.camera._useCtrlForPanning) ||
                                (!this.camera._useCtrlForPanning && this._isPanClick))) {
                            this.camera
                                .inertialPanningX += -(evt.clientX - cacheSoloPointer.x) / this.panningSensibility;
                            this.camera
                                .inertialPanningY += (evt.clientY - cacheSoloPointer.y) / this.panningSensibility;
                        } else {
                            var offsetX = evt.clientX - cacheSoloPointer.x;
                            var offsetY = evt.clientY - cacheSoloPointer.y;
                            this.camera.inertialAlphaOffset -= offsetX / this.angularSensibilityX;
                            this.camera.inertialBetaOffset -= offsetY / this.angularSensibilityY;
                        }*/

                        //cacheSoloPointer.x = evt.clientX;
                        //cacheSoloPointer.y = evt.clientY;

                        this._prevX = evt.clientX;
                        this._prevY = evt.clientY;
                    }

                    // Two buttons down: pinch
                    /*else if (pointA && pointB) {
                        //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be useful to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                        var ed = (pointA.pointerId === evt.pointerId) ? pointA : pointB;
                        ed.x = evt.clientX;
                        ed.y = evt.clientY;
                        var direction = this.pinchInwards ? 1 : -1;
                        var distX = pointA.x - pointB.x;
                        var distY = pointA.y - pointB.y;
                        var pinchSquaredDistance = (distX * distX) + (distY * distY);
                        if (previousPinchDistance === 0) {
                            previousPinchDistance = pinchSquaredDistance;
                            return;
                        }

                        if (pinchSquaredDistance !== previousPinchDistance) {
                            this.camera
                                .inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) /
                                (this.pinchPrecision *
                                    ((this.angularSensibilityX + this.angularSensibilityY) / 2) *
                                    direction);
                            previousPinchDistance = pinchSquaredDistance;
                        }
                    }*/
                }
            }

            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);

            this._onContextMenu = evt => {
                evt.preventDefault();
            };

            if (!this.camera._useCtrlForPanning) {
                element.addEventListener("contextmenu", this._onContextMenu, false);
            }

            this._onLostFocus = () => {
                //this._keys = [];
                //pointA = pointB = undefined;
                //previousPinchDistance = 0;
                //cacheSoloPointer = null;
            };

            this._onMouseMove = evt => {
                if (!engine.isPointerLock) {
                    return;
                }

                var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;

                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };

            this._onGestureStart = e => {
                if (window.MSGesture === undefined) {
                    return;
                }

                if (!this._MSGestureHandler) {
                    this._MSGestureHandler = new MSGesture();
                    this._MSGestureHandler.target = element;
                }

                this._MSGestureHandler.addPointer(e.pointerId);
            };

            this._onGesture = e => {

                if (e.preventDefault) {
                    if (!noPreventDefault) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }
            };

            element.addEventListener("mousemove", this._onMouseMove, false);
            element.addEventListener("MSPointerDown", this._onGestureStart, false);
            element.addEventListener("MSGestureChange", this._onGesture, false);

            element.addEventListener("keydown", this._onKeyDown, false);
            element.addEventListener("keyup", this._onKeyUp, false);

            Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        public detachControl(element: HTMLElement) {
            if (element && this._observer) {
                this.camera.getScene().onPointerObservable.remove(this._observer);
                this._observer = null;

                element.removeEventListener("contextmenu", this._onContextMenu);
                element.removeEventListener("mousemove", this._onMouseMove);
                element.removeEventListener("MSPointerDown", this._onGestureStart);
                element.removeEventListener("MSGestureChange", this._onGesture);

                element.removeEventListener("keydown", this._onKeyDown);
                element.removeEventListener("keyup", this._onKeyUp);

                this._prevX = undefined;
                this._prevY = undefined;
                this._isRotating = false;
                this._isPanning  = false;
                this._isZooming  = false;

                this._onKeyDown = null;
                this._onKeyUp = null;
                this._onMouseMove = null;
                this._onGestureStart = null;
                this._onGesture = null;
                this._MSGestureHandler = null;
                this._onLostFocus = null;
                this._onContextMenu = null;
            }

            Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        }

        getTypeName(): string {
            return "TrackballCameraPointersInput";
        }

        getSimpleName() {
            return "pointers";
        }
    }

    CameraInputTypes["TrackballCameraPointersInput"] = TrackballCameraPointersInput;
}


