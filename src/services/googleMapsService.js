const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let loader = null;
let placesService = null;
let geocoder = null;
let mapInstance = null;

export const initGoogleMaps = async () => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API Key não configurada. Configure VITE_GOOGLE_MAPS_API_KEY no .env');
    return false;
  }

  if (loader) {
    return true; // Já inicializado
  }

  try {
    const { Loader } = await import('@googlemaps/js-api-loader');
    loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geocoding']
    });

    await loader.load();
    return true;
  } catch (error) {
    console.error('Erro ao carregar Google Maps API:', error);
    return false;
  }
};

export const getPlacesService = () => {
  return placesService;
};

export const getGeocoder = () => {
  if (!geocoder && window.google) {
    geocoder = new window.google.maps.Geocoder();
  }
  return geocoder;
};

export const searchCEP = async (cep) => {
  try {
    // Remove caracteres não numéricos
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      return null;
    }

    // Usa API ViaCEP para buscar endereço
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (data.erro) {
      return null;
    }

    // Formata endereço completo
    const endereco = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}, ${data.cep}`;
    
    return {
      cep: data.cep,
      endereco,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
      complemento: data.complemento || ''
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

export const geocodeAddress = async (address) => {
  try {
    await initGoogleMaps();
    const geocoderInstance = getGeocoder();

    if (!geocoderInstance) {
      return null;
    }

    return new Promise((resolve, reject) => {
      geocoderInstance.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            latitude: location.lat(),
            longitude: location.lng(),
            formatted_address: results[0].formatted_address,
            address_components: results[0].address_components
          });
        } else {
          reject(new Error('Geocodificação falhou: ' + status));
        }
      });
    });
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    return null;
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    await initGoogleMaps();
    const geocoderInstance = getGeocoder();

    if (!geocoderInstance) {
      return null;
    }

    return new Promise((resolve, reject) => {
      geocoderInstance.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, status) => {
          if (status === 'OK' && results[0]) {
            resolve({
              formatted_address: results[0].formatted_address,
              address_components: results[0].address_components
            });
          } else {
            reject(new Error('Geocodificação reversa falhou: ' + status));
          }
        }
      );
    });
  } catch (error) {
    console.error('Erro ao fazer geocodificação reversa:', error);
    return null;
  }
};

export const validateCoordinates = (latitude, longitude) => {
  if (latitude === null || longitude === null) {
    return false;
  }
  
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const formatCEP = (cep) => {
  if (!cep) return '';
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return clean;
};
