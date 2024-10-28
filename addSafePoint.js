function add_safe_point_mode() {
        let circle_select = null
        let btn_submit = Array.from(document.getElementsByClassName("btn-submit"))
        let btn_ok = document.getElementById("btn-ok")
        let isDrag = false;
        let list_form = ['', 'form-0', 'confirmationModal', 'radiusModal']
        let form_state = 0;
        let tempMarker, permanentMarker
        let addMode = false; // Flag for adding mode
        let currentLatLng = null;
        var marker_select
        var offsetX, offsetY
        let activeMove
        let list_space = Array.from(document.getElementsByClassName("space"))
        let list_p_space = []
        list_space.forEach(p => {
            list_p_space.push(p.parentElement)
        })
        function getIcon(type) {
            let iconUrl;
            switch (type) {
                case 'home':
                    iconUrl = 'house.png';
                    break;
                case 'school':
                    iconUrl = 'school.png';
                    break;
                case 'company':
                    iconUrl = 'company.png';
                    break;
                case 'park':
                    iconUrl = 'park.png';
                    break;
                default:
                    iconUrl = 'https://cdn-icons-png.flaticon.com/512/25/25694.png';
                    }
            let iconSize = [30, 30];
            return L.icon({
                    iconUrl: iconUrl,
                    iconSize: iconSize,
                });
        }
        function get_marker(tmp_marker) {
            let new_marker = L.marker(tmp_marker.latlng, { icon: getIcon(tmp_marker.type) }).bindPopup(`<b>${tmp_marker.name}</b><br>Radius: ${tmp_marker.radius}`)
                return new_marker;
        }
        function loadMarkersFromFirebase() {
            const dbRef = ref(database, 'markers');
            get(dbRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const markersData = snapshot.val();
                    for (const key in markersData) {
                        if (markersData.hasOwnProperty(key)) {
                            const latlng = markersData[key].latlng;
                            const markerId = markersData[key].markerId;
                            const name = markersData[key].name;
                            const radius = markersData[key].radius;
                            const type = markersData[key].type;
                            markerCount[type]++;
                            let new_marker = { name: name, type: type, radius: radius, latlng: latlng, markerId: markerId }
                            const marker_save = L.marker(latlng, { icon: getIcon(type), className: 'leaflet-marker-icon' })
                                .bindPopup(`<b>${name}</b><br>Radius: ${radius}`);
                            new_marker.marker = marker_save
                            markersArray.push(new_marker)
                            marker_save.addTo(map)
                            marker_save.on('click', function () {
                            if (!isCircleVisible) {
                                activeCircle = L.circle(latlng, { radius: radius }).addTo(map);
                                    marker_save.openPopup();
                                    activeMarker = marker_save; // Store the active marker
                            } else {
                            if (activeCircle) map.removeLayer(activeCircle); // Remove the circle if it exists
                                    marker_save.closePopup();
                            }
                            isCircleVisible = !isCircleVisible; // Toggle the state
                            });
                            console.log(`Marker ${markerId} loaded: ${name}`);
                            console.log(markersArray)
                        }
                }
                        } else {
                            console.log("No markers found in Firebase.");
                        }
                    }).catch((error) => {
                        console.error("Error fetching markers: ", error);
                    });
                }
                window.onload = (() => {
                    loadMarkersFromFirebase();
                    loadMessagesFromFirebase();
                });
                list_p_space.forEach(space => {
                    space.addEventListener("mousedown", e => {
                        const str = e.target.tagName
                        if (str != "INPUT" && str != "SELECT" && str != "OPTION") {
                            console.log(e)
                            isDrag = true;
                            activeMove = space
                            offsetX = e.clientX - activeMove.offsetLeft;
                            offsetY = e.clientY - activeMove.offsetTop;
                        }
                    })
                })
                function get_id() {
                    let i = 1;
                    if (!markersArray.length) return i;
                    markersArray.forEach(m => {

                        if (m.markerId != i) {
                            return i
                        }
                        i++;
                    })
                    return markersArray.length + 1;
                }
                list_p_space.forEach(p => {
                    document.addEventListener("mousemove", function (e) {
                        if (isDrag) {
                            p.style.left = (e.clientX - offsetX) + "px";
                            p.style.top = (e.clientY - offsetY) + "px";
                        }
                    });

                    document.addEventListener("mouseup", function () {
                        isDrag = false;
                    });
                })
                function resetModal() {
                    list_p_space.forEach(p => {
                        console.log(p)
                        p.style.left = 50 + "%"
                        p.style.top = 50 + "%"
                    })
                }
                btn_cancel.forEach(btn => {
                    btn.onclick = (() => {
                        btn.parentElement.parentElement.style.display = 'none';
                        form_state = 0;
                        addMode = false
                        if (tempMarker) map.removeLayer(tempMarker);
                        if (circle_select) map.removeLayer(circle_select)
                        circle_select = null
                        resetModal()
                        enableAllFuntions()
                        showNotification(0)
                        isSubmited = 0
                    })
                })
                btn_ok.onclick = (() => {
                    btn_ok.parentElement.parentElement.style.display = 'none';
                    addMode = true;
                })
                document.getElementById('addSafePointButton').onclick = function () {
                    resetModal()
                    toggleForm(list_form[0], list_form[1]);
                    form_state++;
                };
                function showNotification(isSuccess) {
                    let noti;
                    if (isSuccess) noti = document.getElementById("noti-add-success")
                    else noti = document.getElementById("noti-add-fail")
                    // Hiện thông báo (trượt từ trên xuống)
                    noti.style.top = '20px';
                    // Sau 3 giây, trượt thông báo lên lại
                    setTimeout(() => {
                        noti.style.top = '-100px';
                    }, 1500);
                }
                let isSubmited = 0;
                map.on('click', function (e) {
                    console.log(e)
                    if (!addMode) return; // Only allow interaction if in adding mode
                    if (isSubmited === 0) {
                        tempMarker = L.marker(e.latlng).addTo(map); // Place new temporary marker
                        currentLatLng = e.latlng;
                        isSubmited = 1;
                        showCustomModal('Are you sure about this point?', function (confirmed) {
                            if (confirmed) {
                                form_state++;
                                showRadiusAndIconModal(currentLatLng); // Proceed with icon and radius input
                            } else {
                                map.removeLayer(tempMarker); // User did not confirm, remove the marker
                                currentLatLng = null;
                                isSubmited = 0;
                            }
                        });
                    }
                });
                function toggleForm(old_form, new_form) {
                    var n_form = document.getElementById(new_form);
                    var o_form = document.getElementById(old_form);
                    if (old_form != '') {
                        o_form.style.display = 'none';
                    }
                    if (new_form != '') {
                        n_form.style.display = 'block'
                    }
                }
                function showCustomModal(text, callback) {
                    document.getElementById('modalText').innerText = text;
                    document.getElementById('confirmationModal').style.display = 'block';

                    document.getElementById('confirmYes').onclick = function () {
                        callback(true);
                        document.getElementById('confirmationModal').style.display = 'none';
                    };
                    document.getElementById('confirmNo').onclick = function () {
                        callback(false);
                        document.getElementById('confirmationModal').style.display = 'none';
                    };
                }
                function showRadiusAndIconModal(latlng) {
                    document.getElementById('radiusModal').style.display = 'block';
                    let slider = document.getElementById('radiusInput')
                    const radiusValue = document.getElementById("radiusValue");
                    slider.oninput = function () {
                        if (circle_select) map.removeLayer(circle_select)
                        const radiusInMeters = this.value;
                        circle_select = L.circle(latlng, { radius: radiusInMeters }).addTo(map)
                        radiusValue.innerHTML = "Radius: " + radiusInMeters + " meters";
                    }
                    document.getElementById('submitRadius').onclick = function () {
                        let selectedIconType = document.getElementById('iconSelector').value;
                        let radius = slider.value
                        if (radius) {
                            markerCount[selectedIconType]++;
                            let defaultName = `${selectedIconType} ${markerCount[selectedIconType]}`;
                            document.getElementById('radiusModal').style.display = 'none'
                            showNameModal(defaultName, latlng, selectedIconType, radius);
                        }
                    };
                }

                function showNameModal(defaultName, latlng, iconType, radius) {
                    document.getElementById('nameModal').style.display = 'block';
                    document.getElementById('submitName').onclick = function () {
                        let name = document.getElementById('nameInput').value || defaultName;
                        document.getElementById('nameModal').style.display = 'none';
                        marker_select = L.marker(latlng, { icon: getIcon(iconType) }).addTo(map)
                            .bindPopup(`<b>${name}</b><br>Radius: ${radius}`);
                        saveMarker(name, iconType, radius, latlng, marker_select)
                        console.log(markersArray)
                        addMode = false; // Exit add mode after finalizing the marker
                        isSubmited = 0;
                    };
                }
                function saveMarker(name, type, radius, latlng, marker1) {
                    let n = get_id()
                    let new_marker = { name: name, type: type, radius: radius, latlng: { lat: latlng.lat, lng: latlng.lng }, markerId: n, marker: marker1 }
                    markersArray.push(new_marker);
                    enableAllFuntions()
                    const markerRef = ref(database, `markers/${new_marker.markerId}`); // Tham chiếu đến vị trí muốn lưu marker
                    set(markerRef, { name: name, type: type, radius: radius, latlng: { lat: latlng.lat, lng: latlng.lng }, markerId: n })
                        .then(() => {
                            console.log("Marker added successfully");
                        })
                        .catch((error) => {
                            console.error("Error adding marker: ", error);
                        });
                    map.removeLayer(circle_select)
                    resetModal()
                    showNotification(1)
                    marker1.on('click', function () 
                    {
                        if (!isCircleVisible) {
                            activeCircle = L.circle(latlng, { radius: radius }).addTo(map);
                            marker1.openPopup();
                            activeMarker = marker1; // Store the active marker
                        } else {
                            if (activeCircle) map.removeLayer(activeCircle); // Remove the circle if it exists
                            marker1.closePopup();
                        }
                        isCircleVisible = !isCircleVisible; // Toggle the state
                    });
                    map.removeLayer(tempMarker);
                }
                map.on('click', function (e) {
                    if (activeMarker && !activeMarker.getLatLng().equals(e.latlng)) {
                        if (activeCircle) {
                            map.removeLayer(activeCircle);
                            activeMarker.closePopup();
                            isCircleVisible = false;
                        }
                    }
                });
                // biến cần lưu: markerArray
            }