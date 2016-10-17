var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var TrackballCamera = (function (_super) {
        __extends(TrackballCamera, _super);
        function TrackballCamera(name, position, target, upVector, scene) {
            _super.call(this, name, position, scene);
            //-- end properties for backward compatibility for inputs        
            // Drag full height of screen moves position farther or closer by zoomFactor or 1/zoomFactor
            //@serialize()   TODO: what is this serialize?  Does not fit in Babylon 2.3
            this.zoomFactor = 2;
            this._viewMatrix = new BABYLON.Matrix();
            if (!position) {
                this.position = new BABYLON.Vector3(0, 0, -1);
            }
            else {
                this.position = new BABYLON.Vector3(position.x, position.y, position.z);
            }
            if (!target) {
                this.target = new BABYLON.Vector3(0, 0, 0);
            }
            else {
                this.target = new BABYLON.Vector3(target.x, target.y, target.z);
            }
            if (!upVector) {
                this.upVector = new BABYLON.Vector3(0, 1, 0);
            }
            else {
                this.upVector = new BABYLON.Vector3(upVector.x, upVector.y, upVector.z);
            }
            this.bboxMin = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this.bboxMax = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            this.defaultPosition = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z);
            this.defaultTarget = new BABYLON.Vector3(this.target.x, this.target.y, this.target.z);
            this.defaultUpVector = new BABYLON.Vector3(this.upVector.x, this.upVector.y, this.upVector.z);
            this.getViewMatrix();
            this.inputs = new BABYLON.TrackballCameraInputsManager(this);
            //this.inputs.addKeyboard().addMouseWheel().addPointers().addGamepad();
            this.inputs.addPointers();
        }
        Object.defineProperty(TrackballCamera.prototype, "keysUp", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysUp;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysUp = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TrackballCamera.prototype, "keysDown", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysDown;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysDown = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TrackballCamera.prototype, "keysLeft", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysLeft;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysLeft = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TrackballCamera.prototype, "keysRight", {
            get: function () {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    return keyboard.keysRight;
            },
            set: function (value) {
                var keyboard = this.inputs.attached["keyboard"];
                if (keyboard)
                    keyboard.keysRight = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TrackballCamera.prototype, "wheelPrecision", {
            get: function () {
                var mousewheel = this.inputs.attached["mousewheel"];
                if (mousewheel)
                    return mousewheel.wheelPrecision;
            },
            set: function (value) {
                var mousewheel = this.inputs.attached["mousewheel"];
                if (mousewheel)
                    mousewheel.wheelPrecision = value;
            },
            enumerable: true,
            configurable: true
        });
        TrackballCamera.prototype.setDefault = function (position, target, upVector) {
            this.defaultPosition.copyFrom(position);
            this.defaultTarget.copyFrom(target);
            this.defaultUpVector.copyFrom(upVector);
        };
        TrackballCamera.prototype.resetToDefault = function () {
            this.position.copyFrom(this.defaultPosition);
            this.target.copyFrom(this.defaultTarget);
            this.upVector.copyFrom(this.defaultUpVector);
        };
        // Cache
        TrackballCamera.prototype._initCache = function () {
            _super.prototype._initCache.call(this);
            this._cache.target = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        };
        TrackballCamera.prototype._updateCache = function (ignoreParentClass) {
            if (!ignoreParentClass) {
                _super.prototype._updateCache.call(this);
            }
            this._cache.target.copyFrom(this.target);
        };
        // Methods
        TrackballCamera.prototype.attachControl = function (element, noPreventDefault) {
            this.inputs.attachElement(element, noPreventDefault);
        };
        TrackballCamera.prototype.detachControl = function (element) {
            this.inputs.detachElement(element);
            if (this._reset) {
                this._reset();
            }
        };
        TrackballCamera.prototype._checkInputs = function () {
            this.inputs.checkInputs();
            // Limits
            this._checkLimits();
            _super.prototype._checkInputs.call(this);
        };
        TrackballCamera.prototype._checkLimits = function () {
        };
        TrackballCamera.prototype.setPosition = function (position) {
            if (this.position.equals(position)) {
                return;
            }
            this.position.copyFrom(position);
            this.updateClipPlanes();
        };
        TrackballCamera.prototype.setTarget = function (target) {
            if (this.target.equals(target)) {
                return;
            }
            this.target.copyFrom(target);
            this.updateClipPlanes();
        };
        TrackballCamera.prototype.setUpVector = function (upVector) {
            if (this.upVector.equals(upVector)) {
                return;
            }
            this.upVector.copyFrom(upVector);
        };
        //Directly set the bounds
        TrackballCamera.prototype.setBoundingBox = function (bboxMin, bboxMax) {
            if (this.bboxMin.equals(bboxMin) && this.bboxMax.equals(bboxMax)) {
                return;
            }
            this.bboxMin.copyFrom(bboxMin);
            this.bboxMax.copyFrom(bboxMax);
        };
        TrackballCamera.prototype.resetBoundingBox = function () {
            this.bboxMin = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            this.bboxMax = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        };
        //Expand bounding box to enclose points
        TrackballCamera.prototype.expandBoundingBox = function (bboxMin, bboxMax) {
            if (this.bboxMin.x > bboxMin.x)
                this.bboxMin.x = bboxMin.x;
            if (this.bboxMin.y > bboxMin.y)
                this.bboxMin.y = bboxMin.y;
            if (this.bboxMin.z > bboxMin.z)
                this.bboxMin.z = bboxMin.z;
            if (this.bboxMax.x < bboxMax.x)
                this.bboxMax.x = bboxMax.x;
            if (this.bboxMax.y < bboxMax.y)
                this.bboxMax.y = bboxMax.y;
            if (this.bboxMax.z < bboxMax.z)
                this.bboxMax.z = bboxMax.z;
        };
        //Recompute minZ and maxZ
        TrackballCamera.prototype.updateClipPlanes = function () {
            if (this.bboxMin.x > this.bboxMax.x ||
                this.bboxMin.y > this.bboxMax.y ||
                this.bboxMin.z > this.bboxMax.z) {
                //No bounds are set, so choose arbitrary minZ/maxZ 
                this.minZ = 0.1;
                this.maxZ = 1.0;
                return;
            }
            var bboxRadius = BABYLON.Vector3.Distance(this.bboxMin, this.bboxMax) / 2.0;
            var vecToBBox = BABYLON.Vector3.Center(this.bboxMin, this.bboxMax).subtract(this.position);
            var vecToTarget = this.target.subtract(this.position).normalize();
            var distToBBox = BABYLON.Vector3.Dot(vecToBBox, vecToTarget);
            this.maxZ = distToBBox + bboxRadius;
            if (this.maxZ <= 0.0) {
                //All geometry is behind viewer, choose arbitrary minZ/maxZ
                this.minZ = 0.1;
                this.maxZ = 1.0;
                return;
            }
            this.minZ = distToBBox - bboxRadius;
            if (this.minZ < this.maxZ * 0.001) {
                this.minZ = this.maxZ * 0.001;
            }
        };
        TrackballCamera.prototype._getViewMatrix = function () {
            if (this.getScene().useRightHandedSystem) {
                //Babylon.js crashes when I call LookAtRHToRef.  Not sure why.  This function exists in babylon.math.ts,
                //but is implemented wrong
                //Matrix.LookAtRHToRef(this.position, this.target, this.upVector, this._viewMatrix);
                var s = BABYLON.Matrix.Scaling(-1, 1, 1);
                BABYLON.Matrix.LookAtLHToRef(this.target, this.position, this.upVector, this._viewMatrix);
                this._viewMatrix = s.multiply(this._viewMatrix);
            }
            else {
                BABYLON.Matrix.LookAtLHToRef(this.position, this.target, this.upVector, this._viewMatrix);
            }
            return this._viewMatrix;
        };
        // Get the height of the screen in world space, at the target point
        TrackballCamera.prototype._getWorldSpaceHeight = function () {
            if (this.fovMode == BABYLON.Camera.FOVMODE_VERTICAL_FIXED) {
                return Math.tan(this.fov / 2.0) * BABYLON.Vector3.Distance(this.position, this.target);
            }
            else {
                return Math.tan(this.fov / 2.0) * BABYLON.Vector3.Distance(this.position, this.target) / this.getEngine().getAspectRatio(this);
            }
        };
        // Get the width of the screen in world space, at the target point
        TrackballCamera.prototype._getWorldSpaceWidth = function () {
            if (this.fovMode == BABYLON.Camera.FOVMODE_VERTICAL_FIXED) {
                return Math.tan(this.fov / 2.0) * BABYLON.Vector3.Distance(this.position, this.target) * this.getEngine().getAspectRatio(this);
            }
            else {
                return Math.tan(this.fov / 2.0) * BABYLON.Vector3.Distance(this.position, this.target);
            }
        };
        /*
                public zoomOn(meshes?: AbstractMesh[], doNotUpdateMaxZ = false): void {
                    meshes = meshes || this.getScene().meshes;
        
                    var minMaxVector = Mesh.MinMax(meshes);
                    var distance = Vector3.Distance(minMaxVector.min, minMaxVector.max);
        
                    this.radius = distance * this.zoomOnFactor;
        
                    this.focusOn({ min: minMaxVector.min, max: minMaxVector.max, distance: distance }, doNotUpdateMaxZ);
                }
        
                public focusOn(meshesOrMinMaxVectorAndDistance, doNotUpdateMaxZ = false): void {
                    var meshesOrMinMaxVector;
                    var distance;
        
                    if (meshesOrMinMaxVectorAndDistance.min === undefined) { // meshes
                        meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance || this.getScene().meshes;
                        meshesOrMinMaxVector = Mesh.MinMax(meshesOrMinMaxVector);
                        distance = Vector3.Distance(meshesOrMinMaxVector.min, meshesOrMinMaxVector.max);
                    }
                    else { //minMaxVector and distance
                        meshesOrMinMaxVector = meshesOrMinMaxVectorAndDistance;
                        distance = meshesOrMinMaxVectorAndDistance.distance;
                    }
        
                    this.target = Mesh.Center(meshesOrMinMaxVector);
        
                    if (!doNotUpdateMaxZ) {
                        this.maxZ = distance * 2;
                    }
                }
        */
        /**
         * @override
         * Override Camera.createRigCamera
         */
        /*
                public createRigCamera(name: string, cameraIndex: number): Camera {
                    var alphaShift : number;
                    switch (this.cameraRigMode) {
                        case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                        case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                        case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                        case Camera.RIG_MODE_VR:
                            alphaShift = this._cameraRigParams.stereoHalfAngle * (cameraIndex === 0 ? 1 : -1);
                            break;
                        case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                            alphaShift = this._cameraRigParams.stereoHalfAngle * (cameraIndex === 0 ? -1 : 1);
                            break;
                   }
                    var rigCam = new TrackballCamera(name, this.alpha + alphaShift, this.beta, this.radius, this.target, this.getScene());
                    rigCam._cameraRigParams = {};
                    return rigCam;
                }
        */
        /**
         * @override
         * Override Camera._updateRigCameras
         */
        /*
                public _updateRigCameras() {
                    var camLeft  = <TrackballCamera>this._rigCameras[0];
                    var camRight = <TrackballCamera>this._rigCameras[1];
                    
                    camLeft.beta = camRight.beta = this.beta;
                    camLeft.radius = camRight.radius = this.radius;
        
                    switch (this.cameraRigMode) {
                        case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
                        case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
                        case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
                        case Camera.RIG_MODE_VR:
                            camLeft.alpha  = this.alpha - this._cameraRigParams.stereoHalfAngle;
                            camRight.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle;
                            break;
                        case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                            camLeft.alpha  = this.alpha + this._cameraRigParams.stereoHalfAngle;
                            camRight.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle;
                            break;
                    }
                    super._updateRigCameras();
                }
        */
        TrackballCamera.prototype.dispose = function () {
            this.inputs.clear();
            _super.prototype.dispose.call(this);
        };
        TrackballCamera.prototype.getTypeName = function () {
            return "TrackballCamera";
        };
        return TrackballCamera;
    }(BABYLON.Camera));
    BABYLON.TrackballCamera = TrackballCamera;
})(BABYLON || (BABYLON = {}));
