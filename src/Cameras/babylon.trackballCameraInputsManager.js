var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var TrackballCameraInputsManager = (function (_super) {
        __extends(TrackballCameraInputsManager, _super);
        function TrackballCameraInputsManager(camera) {
            _super.call(this, camera);
        }
        TrackballCameraInputsManager.prototype.addPointers = function () {
            this.add(new BABYLON.TrackballCameraPointersInput());
            return this;
        };
        return TrackballCameraInputsManager;
    }(BABYLON.CameraInputsManager));
    BABYLON.TrackballCameraInputsManager = TrackballCameraInputsManager;
})(BABYLON || (BABYLON = {}));
