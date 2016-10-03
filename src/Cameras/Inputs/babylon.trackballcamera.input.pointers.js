function PrintDebug(s) {
    var elem = document.getElementById("DaveDebug");
    elem.innerHTML = "<p>" + s + "</p>";
}
var BABYLON;
(function (BABYLON) {
    var eventPrefix = BABYLON.Tools.GetPointerPrefix();
    var TrackballCameraPointersInput = (function () {
        function TrackballCameraPointersInput() {
            this._isRotating = false;
            this._isPanning = false;
            this._isZooming = false;
            this._prevX = undefined;
            this._prevY = undefined;
        }
        TrackballCameraPointersInput.prototype._intersectSphere = function (rayPos, rayDir, radius) {
            // a, b, and c are coeffiecients of the quatratic equation  a*x*x + b*x +c = 0
            // x = (-b +/- sqrt(b*b - 4*a*c)) / 2*a
            var a = rayDir.lengthSquared();
            var b = 2.0 * ((rayPos.x - this.camera.target.x) * rayDir.x +
                (rayPos.y - this.camera.target.y) * rayDir.y +
                (rayPos.z - this.camera.target.z) * rayDir.z);
            var c = BABYLON.Vector3.DistanceSquared(rayPos, this.camera.target) - Math.pow(radius, 2);
            var tmp = (b * b - 4 * a * c);
            if (tmp <= 0.0) {
                return 0.0;
            }
            else {
                var ret0 = (-b - Math.sqrt(tmp)) / (2 * a);
                var ret1 = (-b + Math.sqrt(tmp)) / (2 * a);
                return Math.min(ret0, ret1);
            }
        };
        TrackballCameraPointersInput.prototype.attachControl = function (element, noPreventDefault) {
            var _this = this;
            var engine = this.camera.getEngine();
            //var cacheSoloPointer: { x: number, y: number, pointerId: number, type: any }; // cache pointer object for better perf on camera rotation
            //var pointA: { x: number, y: number, pointerId: number, type: any }; //, pointB: { x: number, y: number, pointerId: number, type: any };
            //var previousPinchDistance = 0;
            this._pointerInput = function (p, s) {
                var evt = p.event;
                if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                    try {
                        evt.srcElement.setPointerCapture(evt.pointerId);
                    }
                    catch (e) {
                    }
                    // Left: 0, Middle: 1, Right: 2
                    if (evt.button == 0) {
                        _this._isRotating = true;
                    }
                    else if (evt.button == 1) {
                        _this._isPanning = true;
                    }
                    else if (evt.button == 2) {
                        _this._isZooming = true;
                    }
                    _this._prevX = evt.clientX;
                    _this._prevY = evt.clientY;
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
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
                    try {
                        evt.srcElement.releasePointerCapture(evt.pointerId);
                    }
                    catch (e) {
                    }
                    //cacheSoloPointer = null;
                    //previousPinchDistance = 0;
                    //would be better to use pointers.remove(evt.pointerId) for multitouch gestures, 
                    //but emptying completly pointers collection is required to fix a bug on iPhone : 
                    //when changing orientation while pinching camera, one pointer stay pressed forever if we don't release all pointers  
                    //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                    _this._prevX = undefined;
                    _this._prevY = undefined;
                    _this._isRotating = false;
                    _this._isPanning = false;
                    _this._isZooming = false;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                }
                else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                    // One button down
                    if (_this._isRotating || _this._isPanning || _this._isZooming) {
                        if (_this._isRotating) {
                            // radius can aguably be the min or max of these, or the distance to the corner, 
                            // depending on how much of the screen you want the sphere to cover
                            var radius = Math.min(_this.camera._getWorldSpaceWidth(), _this.camera._getWorldSpaceHeight());
                            // Intersect rays from camera.position through the prev and cur points
                            //var rightVec = Vector3.Cross(this.camera.upVector, this.camera.position.subtract(this.camera.target)).normalize();
                            var rightVec = BABYLON.Vector3.Cross(_this.camera.position.subtract(_this.camera.target), _this.camera.upVector).normalize();
                            var prevDistW = (2.0 * _this._prevX / engine.getRenderWidth() - 1.0) * _this.camera._getWorldSpaceWidth();
                            var prevDistH = (-2.0 * _this._prevY / engine.getRenderHeight() + 1.0) * _this.camera._getWorldSpaceHeight();
                            var curDistW = (2.0 * evt.clientX / engine.getRenderWidth() - 1.0) * _this.camera._getWorldSpaceWidth();
                            var curDistH = (-2.0 * evt.clientY / engine.getRenderHeight() + 1.0) * _this.camera._getWorldSpaceHeight();
                            var rayPrev = _this.camera.target.add(rightVec.scale(prevDistW)).add(_this.camera.upVector.scale(prevDistH));
                            var rayCur = _this.camera.target.add(rightVec.scale(curDistW)).add(_this.camera.upVector.scale(curDistH));
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
                            var rayDir = _this.camera.target.subtract(_this.camera.position).normalize();
                            var tPrev = _this._intersectSphere(rayPrev, rayDir, radius);
                            var tCur = _this._intersectSphere(rayCur, rayDir, radius);
                            PrintDebug("Radius " + radius.toString(10) + " Dist " + tCur.toString(10));
                            // Vectors from target to picked points
                            var vPrev = rayPrev.add(rayDir.scale(tPrev)).subtract(_this.camera.target).normalize();
                            var vCur = rayCur.add(rayDir.scale(tCur)).subtract(_this.camera.target).normalize();
                            // Make a rotation from vPrev to vCur, about target, and apply to camera.position and upVector
                            //var axis = Vector3.Cross(vPrev, vCur).normalize();
                            //var ang  = Vector3.Dot(vPrev, vCur);
                            var axis = BABYLON.Vector3.Cross(vCur, vPrev).normalize();
                            var ang = BABYLON.Vector3.Dot(vCur, vPrev);
                            // machine roundoff can make ang slightly outside its range of -1 to 1.
                            if (ang < -1.0)
                                ang = -1.0;
                            else if (ang > 1.0)
                                ang = 1.0;
                            ang = Math.acos(ang);
                            //PrintDebug("Dist to sphere" + tCur.toString(10) + " Axis " + 
                            //           axis.x.toString(10) + " " +
                            //           axis.y.toString(10) + " " +
                            //           axis.z.toString(10) + " Angle " + ang.toString(10)  );
                            var rotMat = BABYLON.Matrix.RotationAxis(axis, ang);
                            _this.camera.position.subtractInPlace(_this.camera.target);
                            _this.camera.position = BABYLON.Vector3.TransformCoordinates(_this.camera.position, rotMat);
                            _this.camera.position.addInPlace(_this.camera.target);
                            _this.camera.upVector = BABYLON.Vector3.TransformCoordinates(_this.camera.upVector, rotMat);
                        }
                        else if (_this._isPanning) {
                            // Intersect rays with a plane through the target point, 
                            //PrintDebug(evt.clientX.toString(10) + ", " + evt.clientY.toString(10));
                            var rightVec = BABYLON.Vector3.Cross(_this.camera.upVector, _this.camera.position.subtract(_this.camera.target)).normalize();
                            var xdist = ((evt.clientX - _this._prevX) / engine.getRenderWidth()) * 2.0 * _this.camera._getWorldSpaceWidth();
                            var ydist = ((evt.clientY - _this._prevY) / engine.getRenderHeight()) * 2.0 * _this.camera._getWorldSpaceHeight();
                            var offset = rightVec.scale(xdist);
                            offset.addInPlace(_this.camera.upVector.scale(ydist));
                            _this.camera.position.addInPlace(offset);
                            _this.camera.target.addInPlace(offset);
                        }
                        else if (_this._isZooming) {
                            // zoomPerPixel ** engine.getRenderHeight() == this.camera.zoomFactor
                            // This means dragging from bottom to top will move the camera 'zoomFactor' farther away
                            // Dragging top to bottom will move the camera closer by 1/zoomFactor 
                            var zoomPerPixel = Math.pow(_this.camera.zoomFactor, (1.0 / engine.getRenderHeight()));
                            var zoomAmount = Math.pow(zoomPerPixel, (_this._prevY - evt.clientY));
                            _this.camera.position = _this.camera.target.add(_this.camera.position.subtract(_this.camera.target).scale(zoomAmount));
                        }
                        _this._prevX = evt.clientX;
                        _this._prevY = evt.clientY;
                    }
                }
            };
            this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
            this._onContextMenu = function (evt) {
                evt.preventDefault();
            };
            if (!this.camera._useCtrlForPanning) {
                element.addEventListener("contextmenu", this._onContextMenu, false);
            }
            this._onLostFocus = function () {
                //this._keys = [];
                //pointA = pointB = undefined;
                //previousPinchDistance = 0;
                //cacheSoloPointer = null;
            };
            this._onMouseMove = function (evt) {
                if (!engine.isPointerLock) {
                    return;
                }
                var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
                if (!noPreventDefault) {
                    evt.preventDefault();
                }
            };
            this._onGestureStart = function (e) {
                if (window.MSGesture === undefined) {
                    return;
                }
                if (!_this._MSGestureHandler) {
                    _this._MSGestureHandler = new MSGesture();
                    _this._MSGestureHandler.target = element;
                }
                _this._MSGestureHandler.addPointer(e.pointerId);
            };
            this._onGesture = function (e) {
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
            BABYLON.Tools.RegisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        };
        TrackballCameraPointersInput.prototype.detachControl = function (element) {
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
                this._isPanning = false;
                this._isZooming = false;
                this._onKeyDown = null;
                this._onKeyUp = null;
                this._onMouseMove = null;
                this._onGestureStart = null;
                this._onGesture = null;
                this._MSGestureHandler = null;
                this._onLostFocus = null;
                this._onContextMenu = null;
            }
            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "blur", handler: this._onLostFocus }
            ]);
        };
        TrackballCameraPointersInput.prototype.getTypeName = function () {
            return "TrackballCameraPointersInput";
        };
        TrackballCameraPointersInput.prototype.getSimpleName = function () {
            return "pointers";
        };
        return TrackballCameraPointersInput;
    }());
    BABYLON.TrackballCameraPointersInput = TrackballCameraPointersInput;
    BABYLON.CameraInputTypes["TrackballCameraPointersInput"] = TrackballCameraPointersInput;
})(BABYLON || (BABYLON = {}));
