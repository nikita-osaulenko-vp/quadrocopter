const readline = require('readline');

const isAdjacent = (t1, t2) =>
    Math.sqrt(Math.pow(t1.x - t2.x, 2) + Math.pow(t1.y - t2.y, 2)) < (t1.power + t2.power);

const isInRange = (copter, transmitter) =>
    Math.sqrt(Math.pow(transmitter.x - copter.x, 2) + Math.pow(transmitter.y - copter.y, 2)) < transmitter.power;

const asyncQuestion = async (rl, question) => new Promise((resolve) => {
    rl.question(question, resolve);
});

const asyncQuestionFormat = async (rl, question, format = /.*/, allowEOL = true) => {
    for (; ;) {
        const str = await asyncQuestion(rl, question);
        if (allowEOL && str === '') {
            return str;
        }
        if (format.test(str)) {
            return str;
        }
        console.log('Please check your answer format');
    }
}

const strToNumberArray = (str) => str.replace(/\s+/, ' ').split(' ').map((s) => parseInt(s, 10));

const strToVector = (str) => {
    const [x, y] = strToNumberArray(str);
    return {x, y};
};

const strToVectorWithPower = (str) => {
    const [x, y, power] = strToNumberArray(str);
    return {x, y, power};
};

const readFromUser = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const transmitters = [];

    for (; ;) {
        const str = await asyncQuestionFormat(rl, `${transmitters.length ? 'Next' : 'First'} transmitter coordinates X Y Power (empty line when finished):`, /^\d+\s+\d+\s+\d+/)
        if (str === '') {
            break;
        }
        transmitters.push(strToVectorWithPower(str));
    }

    const startingPoint = strToVector(await asyncQuestionFormat(rl, 'Starting point X Y:', /^\d+\s+\d+/, false));
    const endPoint = strToVector(await asyncQuestion(rl, 'End point X Y:', /^\d+\s+\d+/, false));
    rl.close();
    return {
        transmitters,
        startingPoint,
        endPoint
    };
}

const app = async () => {
    try {
        const {
            transmitters,
            startingPoint,
            endPoint
        } = await readFromUser();

        const startingTransmitters = transmitters.filter((transmitter) => isInRange(startingPoint, transmitter));
        const find = (added = [], processed = []) => {
            if (!added.length) {
                return false;
            }
            const completed = added.reduce((acc, nn) => acc || isInRange(endPoint, nn), false);
            if (completed) {
                return true;
            }

            const toProcess = transmitters.filter((tr) => ![...processed, ...added].find((v) => v === tr));
            const newNeighbors = toProcess.filter((n) => {
                return added.reduce((acc, av) => {
                    return acc || isAdjacent(av, n);
                }, false);
            });

            return find(newNeighbors, [...processed, ...added]);
        }

        if (find(startingTransmitters)) {
            console.log('\x1b[32mSafe passage is possible\x1b[0m');
        } else {
            console.log('\x1b[31mSafe passage is not possible\x1b[0m');
        }
    } catch (e) {
        console.error(e);
    }
};

app();