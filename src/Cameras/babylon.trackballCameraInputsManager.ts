module BABYLON {
    export class TrackballCameraInputsManager extends CameraInputsManager<TrackballCamera> {
        constructor(camera: TrackballCamera) {
            super(camera);
        }

        public addMouseWheel(): TrackballCameraInputsManager {
            this.add(new TrackballCameraMouseWheelInput());
            return this;
        }

        public addPointers(): TrackballCameraInputsManager {
            this.add(new TrackballCameraPointersInput());
            return this;
        }

        public addKeyboard(): TrackballCameraInputsManager {
            this.add(new TrackballCameraKeyboardMoveInput());
            return this;
        }

        public addGamepad(): TrackballCameraInputsManager {
            this.add(new TrackballCameraGamepadInput());
            return this;
        }

        public addVRDeviceOrientation(): TrackballCameraInputsManager {
            this.add(new TrackballCameraVRDeviceOrientationInput());
            return this;
        }
    }
}
