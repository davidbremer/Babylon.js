module BABYLON {
    export class TrackballCamera extends Camera {

        @serializeAsVector3()
        public target: Vector3;


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

        @serialize()
        public zoomOnFactor = 1;

        //public targetScreenOffset = Vector2.Zero();

        @serialize()
        //public allowUpsideDown = true;

        public _viewMatrix = new Matrix();
        public _useCtrlForPanning: boolean;
        public _panningMouseButton: number;
        public inputs: TrackballCameraInputsManager;

        public _reset: () => void;
        
        // Panning
        //public panningAxis: Vector3 = new Vector3(1, 1, 0);
        //private _localDirection: Vector3;
        //private _transformedDirection: Vector3;



        constructor(name: string, position: Vector3, target: Vector3, upVector: Vector3, scene: Scene) {
            super(name, position, scene);

            if (!position) {
                this.position = new Vector3(0, 0, -1);
            } else {
                this.position = position;
            }
            if (!target) {
                this.target = Vector3.Zero();
            } else {
                this.target = target;
            }
            if (!upVector) {
                this.upVector = Vector3.Up();
            } else {
                this.upVector = upVector;
            }

            this.getViewMatrix();
            this.inputs = new TrackballCameraInputsManager(this);
            this.inputs.addKeyboard().addMouseWheel().addPointers().addGamepad();
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

            this._cache.target.copyFrom(this._getTargetPosition());
        }

        private _getTargetPosition(): Vector3 {
            return this.target;
        }

        // Methods
        public attachControl(element: HTMLElement, noPreventDefault?: boolean, useCtrlForPanning: boolean = true, panningMouseButton: number = 2): void {
            this._useCtrlForPanning = useCtrlForPanning;
            this._panningMouseButton = panningMouseButton;

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
        }

        public setTarget(target: Vector3): void {            
            if (this.target.equals(target)) {
                return;
            }
            this.target.copyFrom(target);
        }

        public _getViewMatrix(): Matrix {
            if (this.getScene().useRightHandedSystem) {
                 Matrix.LookAtRHToRef(this.position, this.target, this.upVector, this._viewMatrix);
            } else {
                 Matrix.LookAtLHToRef(this.position, this.target, this.upVector, this._viewMatrix);
            }
            return this._viewMatrix;
        }

        public _getScreenHeight(): number {
            if (this.fovMode == Camera.FOVMODE_VERTICAL_FIXED) {
                return Math.tan(this.fov/2.0) * Vector3.Distance(this.position, this.target);
            } else {
                return Math.tan(this.fov/2.0) * Vector3.Distance(this.position, this.target) / this.getEngine().getAspectRatio(this);
            }
        }

        public _getScreenWidth(): number {
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

