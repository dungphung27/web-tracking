self.onmessage = function(event) {
  const { start, ends } = event.data;
  const distances = [];

  // Hàm tìm nearest point gần nhất bằng OSRM nearest API
  function getNearestPoint(lng, lat) {
    const nearestUrl = `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}?number=1`;
    return fetch(nearestUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data && data.waypoints && data.waypoints.length > 0) {
          const nearest = data.waypoints[0].location;
          return { lng: nearest[0], lat: nearest[1] };
        } else {
          throw new Error('No valid nearest point found.');
        }
      })
      .catch(error => {
        console.error(`Error finding nearest point for (${lng}, ${lat}):`, error);
        return { lng, lat };
      });
  }

  const fetchPromises = ends.map(async (end) => {
    const nearestStart = await getNearestPoint(start.lng, start.lat); 
    const nearestEnd = await getNearestPoint(end.lng, end.lat); 

    const url = `https://router.project-osrm.org/route/v1/driving/${nearestStart.lng},${nearestStart.lat};${nearestEnd.lng},${nearestEnd.lat}?overview=false`;

    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const distance = data.routes[0].distance; 
        if(distance <= end.radius)
            distances.push({ name: end.name,lat: end.lat,lng:end.lng,radius: end.radius,id: end.id, distance: distance / 1000 }); // Lưu khoảng cách theo km và tên marker
      })
      .catch(error => {
        console.error(`Có lỗi xảy ra khi xử lý ${end.name}:`, error);
      });
  });

  Promise.all(fetchPromises).then(() => {
    self.postMessage({ distances });
  });
};
// dữ liệu marker
// dữ liệu 