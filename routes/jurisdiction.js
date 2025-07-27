const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Regions
router.get('/regions', async (req, res) => {
    const regions = await prisma.region.findMany();
    res.json(regions);
});

router.post('/regions', async (req, res) => {
    const { name } = req.body;
    const region = await prisma.region.create({ data: { name } });
    res.json(region);
});

router.put('/regions/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const region = await prisma.region.update({
        where: { id: parseInt(id) },
        data: { name },
    });
    res.json(region);
});

router.delete('/regions/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.region.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
});

// Districts
router.get('/regions/:regionId/districts', async (req, res) => {
    const { regionId } = req.params;
    const districts = await prisma.district.findMany({
        where: { regionId: parseInt(regionId) },
    });
    res.json(districts);
});

router.post('/regions/:regionId/districts', async (req, res) => {
    const { regionId } = req.params;
    const { name } = req.body;
    const district = await prisma.district.create({
        data: { name, regionId: parseInt(regionId) },
    });
    res.json(district);
});

router.put('/districts/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const district = await prisma.district.update({
        where: { id: parseInt(id) },
        data: { name },
    });
    res.json(district);
});

router.delete('/districts/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.district.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
});

// Cities
router.get('/districts/:districtId/cities', async (req, res) => {
    const { districtId } = req.params;
    const cities = await prisma.city.findMany({
        where: { districtId: parseInt(districtId) },
    });
    res.json(cities);
});

router.post('/districts/:districtId/cities', async (req, res) => {
    const { districtId } = req.params;
    const { name } = req.body;
    const city = await prisma.city.create({
        data: { name, districtId: parseInt(districtId) },
    });
    res.json(city);
});

router.put('/cities/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const city = await prisma.city.update({
        where: { id: parseInt(id) },
        data: { name },
    });
    res.json(city);
});

router.delete('/cities/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.city.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
});


// Police Stations
router.get('/cities/:cityId/police-stations', async (req, res) => {
    const { cityId } = req.params;
    const policeStations = await prisma.policeStation.findMany({
        where: { cityId: parseInt(cityId) },
    });
    res.json(policeStations);
});

// Courts
router.get('/cities/:cityId/courts', async (req, res) => {
    const { cityId } = req.params;
    const courts = await prisma.court.findMany({
        where: { cityId: parseInt(cityId) },
    });
    res.json(courts);
});

module.exports = router;
