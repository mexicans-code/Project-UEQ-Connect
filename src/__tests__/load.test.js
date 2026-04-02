import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 10,
    duration: '30s',
};

export default function () {
    const res = http.get('http://localhost:3000/');

    let body;

    try {
        body = JSON.parse(res.body);
    } catch (e) {
        body = {};
    }

    check(res, {
        'status es 200': (r) => r.status === 200,
        'respuesta tiene message correcto': () => body.message === 'UTEQ Connect API',
        'tiempo de respuesta < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}