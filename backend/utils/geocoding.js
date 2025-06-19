const axios = require('axios');
require('dotenv').config();

// Google Maps API Key - .env dosyasından alınır
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// API Key test fonksiyonu
const testApiKey = async () => {
    try {
        const testAddress = 'Girne, KKTC';
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status === 'OK') {
            console.log('API Key çalışıyor!');
            console.log('Test adresi:', testAddress);
            console.log('Bulunan konum:', response.data.results[0].formatted_address);
            console.log('Koordinatlar:', response.data.results[0].geometry.location);
            return true;
        } else {
            console.error('API Key hatası:', response.data.status);
            console.error('Hata mesajı:', response.data.error_message);
            return false;
        }
    } catch (error) {
        console.error('API Key test hatası:', error.message);
        if (error.response) {
            console.error('Hata detayları:', error.response.data);
        }
        return false;
    }
};

// Test fonksiyonunu çalıştır
testApiKey();

// Adresi koordinatlara çevir
const geocodeAddress = async (address) => {
    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
        );

        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return {
                latitude: location.lat,
                longitude: location.lng,
                formatted_address: response.data.results[0].formatted_address
            };
        }
        throw new Error('Geocoding failed');
    } catch (error) {
        console.error('Geocoding error:', error);
        throw error;
    }
};

// İki nokta arasındaki mesafeyi hesapla (Haversine formülü)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const toRad = (value) => {
    return value * Math.PI / 180;
};

// En yakın şubeyi bul
const findNearestBranch = async (latitude, longitude, branches) => {
    let nearestBranch = null;
    let minDistance = Infinity;

    for (const branch of branches) {
        if (branch.latitude && branch.longitude) {
            const distance = calculateDistance(
                latitude,
                longitude,
                branch.latitude,
                branch.longitude
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestBranch = branch;
            }
        }
    }

    return nearestBranch;
};

module.exports = {
    geocodeAddress,
    calculateDistance,
    findNearestBranch
}; 