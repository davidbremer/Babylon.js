function PrintDebug(s) {
    var elem = document.getElementById("DaveDebug");
    if (elem) elem.innerHTML = "<p>"+s+"</p>";
}



module BABYLON {
    var eventPrefix = Tools.GetPointerPrefix();

    export class TrackballCameraPointersInput implements ICameraInput<TrackballCamera> {
        camera: TrackballCamera;

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

        private _intersectSphere(rayPos: Vector3, rayDir: Vector3, radius: number): number {
            // a, b, and c are coeffiecients of the quatratic equation  a*x*x + b*x +c = 0
            // x = (-b +/- sqrt(b*b - 4*a*c)) / 2*a
            var a = rayDir.lengthSquared();
            var b = 2.0 * ( (rayPos.x - this.camera.target.x) * rayDir.x +
                            (rayPos.y - this.camera.target.y) * rayDir.y +
                            (rayPos.z - this.camera.target.z) * rayDir.z );
            var c = Vector3.DistanceSquared(rayPos, this.camera.target) - radius**2;

            var tmp = (b*b - 4*a*c);
            if (tmp <= 0.0) {
                return 0.0;
            } else {
                var ret0 = (-b - Math.sqrt(tmp)) / (2*a);
                var ret1 = (-b + Math.sqrt(tmp)) / (2*a);
                return Math.min(ret0, ret1);
            }
        }

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


                    // Left: 0, Middle: 1, Right: 2
                    if (evt.button == 0) {
                        this._isRotating = true;
                    } else if (evt.button == 1) {
                        this._isPanning = true;
                    } else if (evt.button == 2) {
                        this._isZooming = true;
                    }

                    this._prevX = evt.offsetX;
                    this._prevY = evt.offsetY;
                    

                    // manage pointers
                    //cacheSoloPointer = { x: evt.offsetX, y: evt.offsetY, pointerId: evt.pointerId, type: evt.pointerType };
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
                    if (this._isRotating || this._isPanning || this._isZooming) {   
                        if (this._isRotating) {
                            // radius can aguably be the min or max of these, or the distance to the corner, 
                            // depending on how much of the screen you want the sphere to cover
                            var radius = Math.min(this.camera._getWorldSpaceWidth(), this.camera._getWorldSpaceHeight());

                            // Intersect rays from camera.position through the prev and cur points
                            //var rightVec = Vector3.Cross(this.camera.upVector, this.camera.position.subtract(this.camera.target)).normalize();
                            var rightVec = Vector3.Cross(this.camera.position.subtract(this.camera.target), this.camera.upVector).normalize();

                            var prevDistW = ( 2.0 * this._prevX / engine.getRenderWidth()  - 1.0) * this.camera._getWorldSpaceWidth();
                            var prevDistH = (-2.0 * this._prevY / engine.getRenderHeight() + 1.0) * this.camera._getWorldSpaceHeight();

                            var curDistW  = ( 2.0 * evt.offsetX / engine.getRenderWidth()  - 1.0) * this.camera._getWorldSpaceWidth();
                            var curDistH  = (-2.0 * evt.offsetY / engine.getRenderHeight() + 1.0) * this.camera._getWorldSpaceHeight();
                            
                            var rayPrev = this.camera.target.add( rightVec.scale(prevDistW) ).add( this.camera.upVector.scale(prevDistH) );
                            var rayCur  = this.camera.target.add( rightVec.scale(curDistW)  ).add( this.camera.upVector.scale(curDistH) );

                            //This approach shoots rays from the eye to the sphere.  The problem is, the edge of the sphere
                            //can't be hit, and there is sort of a snap when you drag from the sphere edge to outside the sphere
                            //rayPrev.subtractInPlace(this.camera.position);
                            //rayCur.subtractInPlace(this.camera.position);
                            //var tPrev = this._intersectSphere(this.camera.position, rayPrev, radius );
                            //var tCur  = this._intersectSphere(this.camera.position, rayCur,  radius );

                            // Vectors from target to picked points
                            //var vPrev = this.camera.position.add( rayPrev.scale(tPrev) ).subtract(this.camera.target).normalize();
                            //var vCur  = this.camera.position.add( rayCur.scale(tCur) ).subtract(this.camera.target).normalize();

                            // Plug the equation for a line:  camera.position + t*ray 
                            // into the equation for the sphere:  (x - target.x)**2 + (y - target.y)**2 + (z - target.z)**2 == radius**2
                            // and solve for t.
                            var rayDir = this.camera.target.subtract(this.camera.position).normalize();
                            var tPrev = this._intersectSphere(rayPrev, rayDir, radius );
                            var tCur  = this._intersectSphere(rayCur,  rayDir, radius );
                            //PrintDebug("Radius " + radius.toString(10) + " Dist " + tCur.toString(10));

                            // Vectors from target to picked points
                            var vPrev = rayPrev.add( rayDir.scale(tPrev) ).subtract(this.camera.target).normalize();
                            var vCur  = rayCur.add( rayDir.scale(tCur) ).subtract(this.camera.target).normalize();

                            // Make a rotation from vPrev to vCur, about target, and apply to camera.position and upVector
                            //var axis = Vector3.Cross(vPrev, vCur).normalize();
                            //var ang  = Vector3.Dot(vPrev, vCur);
                            var axis = Vector3.Cross(vCur, vPrev).normalize();
                            var ang  = Vector3.Dot(vCur, vPrev);
                            // machine roundoff can make ang slightly outside its range of -1 to 1.
                            if (ang < -1.0) ang = -1.0
                            else if (ang > 1.0) ang = 1.0;
                            ang = Math.acos(ang);

                            //PrintDebug("Dist to sphere" + tCur.toString(10) + " Axis " + 
                            //           axis.x.toString(10) + " " +
                            //           axis.y.toString(10) + " " +
                            //           axis.z.toString(10) + " Angle " + ang.toString(10)  );


                            var rotMat = Matrix.RotationAxis(axis, ang);

                            this.camera.position.subtractInPlace( this.camera.target );
                            this.camera.position = Vector3.TransformCoordinates(this.camera.position, rotMat);
                            this.camera.position.addInPlace( this.camera.target );

                            this.camera.upVector = Vector3.TransformCoordinates(this.camera.upVector, rotMat);

                            /* PrintDebug("Position " + 
                                       this.camera.position.x.toString(10) + " " +
                                       this.camera.position.y.toString(10) + " " +
                                       this.camera.position.z.toString(10) + "Up " +
                                       this.camera.upVector.x.toString(10) + " " +
                                       this.camera.upVector.y.toString(10) + " " +
                                       this.camera.upVector.z.toString(10) 
                                       ); */



                        } else if (this._isPanning) {
                            // Intersect rays with a plane through the target point, 
                            //PrintDebug(evt.offsetX.toString(10) + ", " + evt.offsetY.toString(10));
                            var rightVec = Vector3.Cross(this.camera.upVector, this.camera.position.subtract(this.camera.target)).normalize();
                            var xdist = ((evt.offsetX - this._prevX) / engine.getRenderWidth())  * 2.0 * this.camera._getWorldSpaceWidth();
                            var ydist = ((evt.offsetY - this._prevY) / engine.getRenderHeight()) * 2.0 * this.camera._getWorldSpaceHeight();

                            var offset = rightVec.scale(xdist); 
                            offset.addInPlace( this.camera.upVector.scale(ydist) );

                            this.camera.position.addInPlace(offset);
                            this.camera.target.addInPlace(offset);

                        } else if (this._isZooming) {
                            // zoomPerPixel ** engine.getRenderHeight() == this.camera.zoomFactor
                            // This means dragging from bottom to top will move the camera 'zoomFactor' farther away
                            // Dragging top to bottom will move the camera closer by 1/zoomFactor 
                            var zoomPerPixel = Math.pow( this.camera.zoomFactor, (1.0 / engine.getRenderHeight()));
                            var zoomAmount = Math.pow( zoomPerPixel, (this._prevY - evt.offsetY) );
                            
                            this.camera.position = this.camera.target.add( this.camera.position.subtract(this.camera.target).scale(zoomAmount) );
                        }

                        this._prevX = evt.offsetX;
                        this._prevY = evt.offsetY;
                        this.camera.updateClipPlanes();

                    }

                    // Two buttons down: pinch
                    /*else if (pointA && pointB) {
                        //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be useful to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                        var ed = (pointA.pointerId === evt.pointerId) ? pointA : pointB;
                        ed.x = evt.offsetX;
                        ed.y = evt.offsetY;
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

            this._onLostFocus = () => {
                //this._keys = [];
                //pointA = pointB = undefined;
                //previousPinchDistance = 0;
                //cacheSoloPointer = null;
            };

            //TODO: Do this optionally, only if the right-button is mapped to an operation.
            element.addEventListener("contextmenu", this._onContextMenu, false);

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


