// ncwdev: работа орошитель полей
const rpc = require('lib/rage-rpc.min.js');
const FeatureLevels = require('duster/FeatureLevels.js');
const JobReception = require('duster/JobReception.js');
const FieldManager = require('duster/FieldManager.js');
const DusterVehicle = require('duster/DusterVehicle.js');
const DusterUI = require('duster/DusterUI.js');

let gotExpa = 0; // опыт, заработанный за сессию
let gotPoints = 0; // сколько взял точек на одном самолете
let playerPointsNumber = 0; // общее число точек игрока - определяет уровень работы

let ui = null;
let jobLevels = null;
let jobVehicle = null;
let fieldManager = null;
let config = null;

function getJobLevelInfo() {
    return jobLevels.getLevelInfoByPoints(playerPointsNumber);
}

async function waitDusterVehicle(vehicle) {
    const isLoaded = await jobVehicle.isLoaded(vehicle);
    if (isLoaded) {
        rpc.triggerServer('ncw.onDusterVehicleReady', vehicle.remoteId);
    } else {
        rpc.triggerServer('ncw.cancelDusterJob', vehicle.remoteId);
    }
}

function onDusterPilotHired(points) {
    playerPointsNumber = points;

    ui.showInstruction();

    // ждем, пока игрок читает подсказки
    setTimeout(() => {
        startDusterJob();
    }, 3000);
}

function startDusterJob() {
    gotExpa = 0;
    gotPoints = 0;

    generateNewField();
    jobVehicle.start();

    mp.events.add('render', renderDusterJob);
}

function generateNewField() {
    const info = getJobLevelInfo();
    fieldManager.generateNewField(info);
}

function endDusterJob() {
    jobVehicle.stop();
    fieldManager.cleanup();

    mp.events.remove('render', renderDusterJob);

    rpc.callServer('ncw.fireDusterPilot').then(() => {
        if (gotPoints > 0) {
            ui.showFinalStats(gotPoints, gotExpa);
        }
    });
}

function renderDusterJob() {
    if (jobVehicle.inGame()) {
        jobVehicle.renderSmoke();

        const vehiclePos = jobVehicle.getPosition();
        if (fieldManager.checkProximity(vehiclePos)) {
            gotDusterJobPoint();

            if (fieldManager.isEmpty()) {
                setTimeout(() => {
                    generateNewField();
                }, 100);
            }
        }
    }
    jobVehicle.checkDriverStatus();
    if (!jobVehicle.hasDriver()) {
        endDusterJob();
    }
}

function gotDusterJobPoint() {
    rpc.callServer('ncw.payForDusterPoint').then(expa => {
        ++gotPoints;
        ++playerPointsNumber;
        gotExpa += expa;

        // прогресс уровня = игрок сделал точек на этом уровне / макс точек уровня
        const levelInfo = getJobLevelInfo();
        ui.updateProgress(levelInfo, playerPointsNumber, gotPoints, gotExpa);
        ui.onGotPoint(expa);
    });
}

function initDusterJob(_config) {
    config = _config;
    new JobReception(config.reception);

    ui = new DusterUI(config);
    jobLevels = new FeatureLevels(config.levels);
    fieldManager = new FieldManager(config);
    jobVehicle = new DusterVehicle(config);

    rpc.on('ncw.waitDusterVehicle', waitDusterVehicle);
    rpc.on('ncw.endDusterJobForced', endDusterJob);
    rpc.on('ncw.onDusterPilotHired', onDusterPilotHired);
}
rpc.on('ncw.initDusterJob', initDusterJob);
