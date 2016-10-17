module BABYLON {
    export class TrackballCamera extends Camera {

        //@serializeAsVector3()   TODO: what is this serialize?  Does not fit in Babylon 2.3
        public target: Vector3;
        public bboxMin: Vector3;  //Bounding box around data, to compute minZ/maxZ
        public bboxMax: Vector3;  //Bounding box around data, to compute minZ/maxZ


        public get keysUp() {
            var keyboard = <TrackballCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysUp;
        }

        public set keysUp(value) {
            var keyboard = <TrackballCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysUp = value;
        }

        public get keysDown() {
            var keyboard = <TrackballCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysDown;
        }

        public set keysDown(value) {
            var keyboard = <TrackballCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysDown = value;
        }

        public get keysLeft() {
            var keyboard = <TrackballCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysLeft;
        }

        public set keysLeft(value) {
            var keyboard = <TrackballCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysLeft = value;
        }

        public get keysRight() {
            var keyboard = <TrackballCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                return keyboard.keysRight;
        }

        public set keysRight(value) {
            var keyboard = <TrackballCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
            if (keyboard)
                keyboard.keysRight = value;
        }

        public get wheelPrecision() {
            var mousewheel = <TrackballCameraMouseWheelInput>this.inputs.attached["mousewheel"];
            if (mousewheel)
                return mousewheel.wheelPrecision;
        }

        public set wheelPrecision(value) {
            var mousewheel = <TrackballCameraMouseWheelInput>this.inputs.attached["mousewheel"];
            if (mousewheel)
                mousewheel.wheelPrecision = value;
        }
        
        //-- end properties for backward compatibility for inputs        

        // Drag full height of screen moves position farther or closer by zoomFactor or 1/zoomFactor
        //@serialize()   TODO: what is this serialize?  Does not fit in Babylon 2.3
        public zoomFactor = 2;

        public _viewMatrix = new Matrix();

        //TODO: zooming can be done by tranlating the position vector closer/farther, 
        //scaling the whole scene, or changing the field of view.  Decide which to support.
        //public _zoomingScales: boolean;


        public inputs: TrackballCameraInputsManager;

        public _reset: () => void;
        
        // Panning
        //public panningAxis: Vector3 = new Vector3(1, 1, 0);
        //private _localDirection: Vector3;
        //private _transformedDirection: Vector3;

        private defaultPosition: Vector3;
        private defaultTarget:   Vector3;
        private defaultUpVector: Vector3;
        


        constructor(name: string, position: Vector3, target: Vector3, upVector: Vector3, scene: Scene) {
            super(name, position, scene);

            if (!position) {
                this.position = new Vector3(0, 0, -1);
            } else {
                this.position = new Vector3(position.x, position.y, position.z);
            }
            if (!target) {
                this.target = new Vector3(0, 0, 0);
            } else {
                this.target = new Vector3(target.x, target.y, target.z);
            }
            if (!upVector) {
                this.upVector = new Vector3(0, 1, 0);
            } else {
                this.upVector = new Vector3(upVector.x, upVector.y, upVector.z);
            }

            this.bboxMin = new Vector3( Number.MAX_VALUE,  Number.MAX_VALUE,  Number.MAX_VALUE);
            this.bboxMax = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

            this.defaultPosition = new Vector3(this.position.x, this.position.y, this.position.z);
            this.defaultTarget   = new Vector3(this.target.x,   this.target.y,   this.target.z);
            this.defaultUpVector = new Vector3(this.upVector.x, this.upVector.y, this.upVector.z);

            this.getViewMatrix();
            this.inputs = new TrackballCameraInputsManager(this);
            //this.inputs.addKeyboard().addMouseWheel().addPointers().addGamepad();
            this.inputs.addPointers();
        }

        public setDefault(position: Vector3, target: Vector3, upVector: Vector3): void {
            this.defaultPosition.copyFrom(position);
            this.defaultTarget.copyFrom(target);
            this.defaultUpVector.copyFrom(upVector);
        }

        public resetToDefault(): void {
            this.position.copyFrom(this.defaultPosition);
            this.target.copyFrom(  this.defaultTarget);
            this.upVector.copyFrom(this.defaultUpVector);
        }

        // Cache
        public _initCache(): void {
            super._initCache();
            this._cache.target = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        }

        public _updateCache(ignoreParentClass?: boolean): void {
            if (!ignoreParentClass) {
                super._updateCache();
            }

            this._cache.target.copyFrom(this.target);
        }

        // Methods
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            this.inputs.attachElement(element, noPreventDefault);
        }

        public detachControl(element: HTMLElement): void {
            this.inputs.detachElement(element);

            if (this._reset) {
                this._reset();
            }
        }

        public _checkInputs(): void {

            this.inputs.checkInputs();

            // Limits
            this._checkLimits();

            super._checkInputs();
        }

        private _checkLimits() {
        }

        public setPosition(position: Vector3): void {
            if (this.position.equals(position)) {
                return;
            }
            this.position.copyFrom(position);
            this.updateClipPlanes();
        }

        public setTarget(target: Vector3): void {            
            if (this.target.equals(target)) {
                return;
            }
            this.target.copyFrom(target);
            this.updateClipPlanes();
        }

        public setUpVector(upVector: Vector3): void {            
            if (this.upVector.equals(upVector)) {
                return;
            }
            this.upVector.copyFrom(upVector);
        }

        //Directly set the bounds
        public setBoundingBox(bboxMin: Vector3, bboxMax: Vector3): void {            
            if (this.bboxMin.equals(bboxMin) && this.bboxMax.equals(bboxMax)) {
                return;
            }
            this.bboxMin.copyFrom(bboxMin);
            this.bboxMax.copyFrom(bboxMax);
        }

        public resetBoundingBox(): void {
            this.bboxMin = new Vector3( Number.MAX_VALUE,  Number.MAX_VALUE,  Number.MAX_VALUE);
            this.bboxMax = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
        }

        //Expand bounding box to enclose points
        public expandBoundingBox(bboxMin: Vector3, bboxMax: Vector3): void {
            if (this.bboxMin.x > bboxMin.x) this.bboxMin.x = bboxMin.x;
            if (this.bboxMin.y > bboxMin.y) this.bboxMin.y = bboxMin.y;
            if (this.bboxMin.z > bboxMin.z) this.bboxMin.z = bboxMin.z;

            if (this.bboxMax.x < bboxMax.x) this.bboxMax.x = bboxMax.x;
            if (this.bboxMax.y < bboxMax.y) this.bboxMax.y = bboxMax.y;
            if (this.bboxMax.z < bboxMax.z) this.bboxMax.z = bboxMax.z;
        }

        //Recompute minZ and maxZ
        public updateClipPlanes(): void {
            if (this.bboxMin.x > this.bboxMax.x ||
                this.bboxMin.y > this.bboxMax.y ||
                this.bboxMin.z > this.bboxMax.z) {

                //No bounds are set, so choose arbitrary minZ/maxZ 
                this.minZ = 0.1;
                this.maxZ = 1.0;
                return;
            }
            var bboxRadius = Vector3.Distance(this.bboxMin, this.bboxMax) / 2.0;
            var vecToBBox = Vector3.Center(this.bboxMin, this.bboxMax).subtract(this.position);
            var vecToTarget = this.target.subtract(this.position).normalize();
            var distToBBox = Vector3.Dot(vecToBBox, vecToTarget);
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
        }

        public _getViewMatrix(): Matrix {
            if (this.getScene().useRightHandedSystem) {
                 //Babylon.js crashes when I call LookAtRHToRef.  Not sure why.  This function exists in babylon.math.ts,
                 //but is implemented wrong
                 //Matrix.LookAtRHToRef(this.position, this.target, this.upVector, this._viewMatrix);
                 var s = Matrix.Scaling(-1,1,1);
                 Matrix.LookAtLHToRef(this.target, this.position, this.upVector, this._viewMatrix);
                 this._viewMatrix = s.multiply(this._viewMatrix);
            } else {
                 Matrix.LookAtLHToRef(this.position, this.target, this.upVector, this._viewMatrix);
                 //var s = Matrix.Scaling(-1,1,1);
                 //Matrix.LookAtLHToRef(this.target, this.position, this.upVector, this._viewMatrix);
                 //this._viewMatrix = s.multiply(this._viewMatrix);
            }
            return this._viewMatrix;
        }

        // Get the height of the screen in world space, at the target point
        public _getWorldSpaceHeight(): number {
            if (this.fovMode == Camera.FOVMODE_VERTICAL_FIXED) {
                return Math.tan(this.fov/2.0) * Vector3.Distance(this.position, this.target);
            } else {
                return Math.tan(this.fov/2.0) * Vector3.Distance(this.position, this.target) / this.getEngine().getAspectRatio(this);
            }
        }

        // Get the width of the screen in world space, at the target point
        public _getWorldSpaceWidth(): number {
            if (this.fovMode == Camera.FOVMODE_VERTICAL_FIXED) {
                return Math.tan(this.fov/2.0) * Vector3.Distance(this.position, this.target) * this.getEngine().getAspectRatio(this);
            } else {
                return Math.tan(this.fov/2.0) * Vector3.Distance(this.position, this.target);
            }
        }


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
        public dispose(): void {
            this.inputs.clear();
            super.dispose();
        }

        public getTypeName(): string {
            return "TrackballCamera";
        }
    }
} 

