document.addEventListener('DOMContentLoaded', async () => {
    console.log('Converter.js 로드됨');

    const citySearch = document.getElementById('city-search');
    const suggestions = document.getElementById('suggestions');
    const addCityBtn = document.getElementById('add-city-btn');
    const selectedCitiesContainer = document.getElementById('selected-cities');
    const timeComparison = document.getElementById('time-comparison');
    const suggestMeetingBtn = document.getElementById('suggest-meeting');
    const meetingSuggestion = document.getElementById('meeting-suggestion');
    const notification = document.getElementById('notification');

    if (!citySearch || !suggestions || !addCityBtn || !selectedCitiesContainer || !timeComparison || !suggestMeetingBtn || !meetingSuggestion || !notification) {
        console.error('시간 변환기에 필요한 하나 이상의 DOM 요소를 찾을 수 없습니다.');
        if (document.body) {
            document.body.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">페이지를 불러오는 중 오류가 발생했습니다. 필수 구성 요소가 누락되었습니다.</p>';
        }
        return;
    }
    console.log('시간 변환기의 모든 DOM 요소가 발견되었습니다.');

    let allAvailableCities = []; 
    const localStorageKey = 'selectedCitiesKo'; 
    let selectedCitiesArray = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    
    console.log('localStorage에서 선택된 도시 로드:', selectedCitiesArray); 
    const maxCities = 5;

    async function loadCityData() {
        const filePath = 'js/cities_ko.json'; 
        try {
            console.log(`도시 데이터 가져오기 시도: ${filePath}`);
            const response = await fetch(filePath); 
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`도시 목록 파일(cities_ko.json)을 '${filePath}' 경로에서 찾을 수 없습니다. 파일 위치와 이름을 다시 확인해주세요.`);
                }
                throw new Error(`도시 목록(cities_ko.json)을 불러오는 데 실패했습니다: ${response.status} ${response.statusText}`);
            }
            allAvailableCities = await response.json();
            console.log('cities_ko.json에서 도시 목록 로드 성공:', allAvailableCities.length, '개 도시');
            
            const validSelectedCities = [];
            selectedCitiesArray.forEach(savedCity => {
                const foundCity = allAvailableCities.find(c => c.name === savedCity.name);
                if (foundCity) {
                    validSelectedCities.push({...savedCity, ...foundCity}); 
                }
            });
            selectedCitiesArray = validSelectedCities;
            localStorage.setItem(localStorageKey, JSON.stringify(selectedCitiesArray));
            updateTimeComparison(); 

        } catch (error) {
            console.error(error.message);
            showNotification(error.message, true); 
            citySearch.disabled = true;
            addCityBtn.disabled = true;
            citySearch.placeholder = "도시 정보를 불러올 수 없습니다.";
        }
    }

    await loadCityData(); 

    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.className = 'notification show'; 
        if (isError) {
            notification.classList.add('error'); 
        }
    }

    function clearSearch() {
        citySearch.value = '';
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';
    }

    function getCityTime(city) {
        const offset = parseFloat(city.offset);
        if (isNaN(offset)) {
            console.error('잘못된 offset 값:', city.name, city.offset);
            return "시간 정보 없음";
        }
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const cityTime = new Date(utc + (offset * 3600000));
        return cityTime.toLocaleTimeString('ko-KR', { hour12: true, hour: 'numeric', minute: '2-digit' });
    }

    function updateTimeComparison() {
        if (!timeComparison || !selectedCitiesContainer) return;

        timeComparison.innerHTML = selectedCitiesArray.length === 0
            ? '<p class="placeholder">시간과 날씨를 비교할 도시를 선택하세요.</p>'
            : '';

        selectedCitiesArray.forEach(city => {
            const time = getCityTime(city);
            const div = document.createElement('div');
            div.className = 'time-comparison-item';

            div.innerHTML = `
                <span>${city.name} (${city.flag ? city.flag.toUpperCase() : 'N/A'})</span>
                <span class="time-value">${time}</span>
                <span class="weather-info">(날씨 정보 준비 중)</span>
            `;
            timeComparison.appendChild(div);
        });

        selectedCitiesContainer.innerHTML = '';
        selectedCitiesArray.forEach(city => {
            const tag = document.createElement('div');
            tag.className = 'city-tag';
            tag.innerHTML = `
                <img src="https://flagcdn.com/w20/${city.flag?.toLowerCase()}.png" alt="${city.flag ? city.flag.toUpperCase() : ''} 국기">
                <span>${city.name}</span>
                <button aria-label="${city.name} 삭제">×</button>
            `;
            tag.querySelector('button').addEventListener('click', () => {
                selectedCitiesArray = selectedCitiesArray.filter(c => c.name !== city.name);
                localStorage.setItem(localStorageKey, JSON.stringify(selectedCitiesArray));
                console.log('도시 삭제됨, localStorage에 저장:', localStorage.getItem(localStorageKey));
                updateTimeComparison();
                showNotification(`${city.name} 삭제됨.`);
                suggestMeetingBtn.disabled = selectedCitiesArray.length < 2;
            });
            selectedCitiesContainer.appendChild(tag);
        });
        suggestMeetingBtn.disabled = selectedCitiesArray.length < 2;
    }

    function addCity(city) {
        if (selectedCitiesArray.length >= maxCities) {
            showNotification(`최대 ${maxCities}개의 도시만 추가할 수 있습니다.`);
            return;
        }
        if (selectedCitiesArray.some(c => c.name === city.name)) {
            showNotification(`${city.name}은(는) 이미 추가된 도시입니다.`);
            return;
        }
        
        const cityToAdd = allAvailableCities.find(c => c.name === city.name);
        if (!cityToAdd) {
            showNotification(`${city.name}을(를) 도시 목록에서 찾을 수 없습니다.`);
            return;
        }

        selectedCitiesArray.push(cityToAdd);
        localStorage.setItem(localStorageKey, JSON.stringify(selectedCitiesArray));
        console.log('도시 추가됨, localStorage에 저장:', localStorage.getItem(localStorageKey));
        updateTimeComparison();
        showNotification(`${cityToAdd.name} 추가됨.`);
        clearSearch();
        suggestMeetingBtn.disabled = selectedCitiesArray.length < 2;
    }

    citySearch.addEventListener('input', () => {
        console.log('검색 입력:', citySearch.value);
        const query = citySearch.value.toLowerCase().trim();
        suggestions.innerHTML = '';
        suggestions.style.display = 'none';

        if (query.length === 0 || allAvailableCities.length === 0) return;

        const filtered = allAvailableCities.filter(city => 
            city.name.toLowerCase().includes(query) || 
            (city.name_en && city.name_en.toLowerCase().includes(query)) 
        );
        console.log('필터링된 도시 (allAvailableCities 기준):', filtered.length);

        if (filtered.length === 0) {
            suggestions.innerHTML = '<div>검색 결과가 없습니다.</div>';
            suggestions.style.display = 'block';
            return;
        }
        
        const limitedFiltered = filtered.slice(0, 10);

        limitedFiltered.forEach(city => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';

            div.innerHTML = `
                <img src="https://flagcdn.com/w20/${city.flag?.toLowerCase()}.png" alt="${city.flag ? city.flag.toUpperCase() : ''} 국기">
                <span>${city.name}${city.continent ? ', ' + city.continent : ''}</span>
            `;
            div.addEventListener('click', () => addCity(city));
            suggestions.appendChild(div);
        });
        suggestions.style.display = 'block';
    });

    citySearch.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            console.log('Enter 키 입력됨');
            const query = citySearch.value.toLowerCase().trim();
            const city = allAvailableCities.find(c => c.name.toLowerCase() === query);
            if (city) {
                addCity(city);
            } else if (suggestions.firstChild && suggestions.firstChild.classList.contains('suggestion-item')) {
                suggestions.firstChild.click();
            } else {
                showNotification('도시를 찾을 수 없습니다.');
            }
            clearSearch(); 
        }
    });
    
    document.addEventListener('click', function(event) {
        if (!citySearch.contains(event.target) && !suggestions.contains(event.target)) {
            suggestions.style.display = 'none';
        }
    });

    addCityBtn.addEventListener('click', () => {
        console.log('도시 추가 버튼 클릭됨');
        const query = citySearch.value.toLowerCase().trim();
        if (!query) {
            showNotification('도시 이름을 입력해주세요.');
            return;
        }
        const city = allAvailableCities.find(c => c.name.toLowerCase() === query);
        if (city) {
            addCity(city);
        } else {
            const firstSuggestionText = suggestions.firstChild?.textContent.split(',')[0].trim();
            if (firstSuggestionText) {
                const firstSuggestedCity = allAvailableCities.find(c => c.name === firstSuggestionText);
                if (firstSuggestedCity) {
                    addCity(firstSuggestedCity);
                } else {
                    showNotification('유효한 도시를 선택해주세요.');
                }
            } else {
                showNotification('유효한 도시를 선택해주세요.');
            }
        }
    });

    suggestMeetingBtn.addEventListener('click', () => {
        console.log('회의 시간 추천 버튼 클릭됨');
        if (selectedCitiesArray.length < 2) return;
        meetingSuggestion.innerHTML = '<p>적절한 회의 시간을 찾는 중...</p>';
        setTimeout(() => {
            const now = new Date();
            const workHoursStart = 9;
            const workHoursEnd = 17;
            let bestSlot = null;

            for (let hourOffset = 0; hourOffset < 24; hourOffset++) {
                const testBaseTime = new Date(now);
                testBaseTime.setHours(now.getHours() + hourOffset, 0, 0, 0); 

                let cityTimesInSlot = [];
                const allInWorkHours = selectedCitiesArray.every(city => {
                    const offset = parseFloat(city.offset);
                    if (isNaN(offset)) return false;

                    const utc = testBaseTime.getTime() + (testBaseTime.getTimezoneOffset() * 60000);
                    const cityLocalDateTime = new Date(utc + (offset * 3600000));
                    const cityHour = cityLocalDateTime.getHours();
                    
                    cityTimesInSlot.push({
                        name: city.name,
                        time: cityLocalDateTime.toLocaleTimeString('ko-KR', { hour12: true, hour: 'numeric', minute: '2-digit' }),
                        isWorkHour: cityHour >= workHoursStart && cityHour < workHoursEnd
                    });
                    return cityHour >= workHoursStart && cityHour < workHoursEnd;
                });

                if (allInWorkHours) {
                    bestSlot = cityTimesInSlot;
                    break; 
                }
            }

            if (bestSlot) {
                meetingSuggestion.innerHTML = `
                    <div class="suggestion-result">
                        <h3>추천 회의 시간</h3>
                        <p>업무 시간(오전 9시 - 오후 5시) 기준:</p>
                        <div class="city-times">
                            ${bestSlot.map(ct => `<p>${ct.name}: ${ct.time}</p>`).join('')}
                        </div>
                    </div>
                `;
            } else {
                const currentCityTimes = selectedCitiesArray.map(city => {
                    const time = getCityTime(city);
                    return `<p>${city.name}: ${time}</p>`;
                }).join('');

                meetingSuggestion.innerHTML = `
                    <div class="suggestion-result">
                        <h3>겹치는 시간 없음</h3>
                        <p>모든 도시의 업무 시간(오전 9시 - 오후 5시)에 맞는 공통 시간을 찾지 못했습니다.</p>
                        <p>현재 각 도시의 시간은 다음과 같습니다:</p>
                        <div class="city-times non-overlap">
                           ${currentCityTimes}
                        </div>
                    </div>
                `;
            }
        }, 1000);
    });

    suggestMeetingBtn.disabled = selectedCitiesArray.length < 2;
    
    if (window.converterTimeUpdateInterval) {
        clearInterval(window.converterTimeUpdateInterval);
    }
    window.converterTimeUpdateInterval = setInterval(() => {
        if (selectedCitiesArray.length > 0) {
            updateTimeComparison();
        }
    }, 60000); 
});
