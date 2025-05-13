document.addEventListener("DOMContentLoaded", async () => {
    let cities = []; 

    const continentColorsKo = {
        "북아메리카": "#388E3C",
        "유럽": "#FBC02D",
        "아시아": "#F57C00",
        "남아메리카": "#1976D2",
        "아프리카": "#303F9F",
        "오세아니아": "#7B1FA2"
    };

    async function loadCityData() {
        try {
            const response = await fetch('js/cities_ko.json'); 
            if (!response.ok) {
                throw new Error(`도시 데이터를 불러오는데 실패했습니다: ${response.status}`);
            }
            cities = await response.json();
            console.log('loadCityData: 도시 데이터 파싱 후 cities 배열 상태:', JSON.stringify(cities.slice(0, 2)), '첫 2개 도시 예시 및 총 도시 수:', cities.length); 
        } catch (error) {
            console.error('도시 데이터 로드 중 오류 발생:', error);
            const clocksContainer = document.getElementById("clocks-container");
            if (clocksContainer) {
                clocksContainer.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">도시 목록을 불러오는 데 실패했습니다. 페이지를 새로고침 해보거나, 네트워크 연결을 확인해주세요.</p>';
            }
            const customClocksSection = document.getElementById("custom-clocks-section");
            if (customClocksSection) {
                customClocksSection.style.display = 'none'; 
            }
        }
    }

    await loadCityData();

    console.log('loadCityData 호출 후, 초기화 로직 진입 전 cities 배열 길이:', cities.length);
    if (cities.length === 0) {
        console.warn('도시 데이터가 비어있거나 로드에 실패하여 시계 기능을 초기화할 수 없습니다.');
        const loadMoreBtn = document.getElementById("load-more");
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
            loadMoreBtn.style.display = 'none';
        }
        const filterButtonsContainer = document.getElementById("filter-buttons");
        if (filterButtonsContainer) {
            filterButtonsContainer.innerHTML = '<p style="text-align: center; color: #6c757d;">표시할 도시 정보가 없습니다.</p>';
        }
        return; 
    }

    let allClocks = [];
    let displayedClocks = 0;
    const clocksPerLoad = 50; 
    const displayedClocksKey = 'worldClocksKoDisplayedCount'; 
    let customClocks = [];

    function toggleFullScreen(elem) {
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => {
                    console.error(`전체화면 모드 활성화 시도 중 오류: ${err.message} (${err.name})`);
                    alert(`전체화면 모드 활성화 중 오류가 발생했습니다: ${err.message}`);
                });
            } else if (elem.mozRequestFullScreen) { 
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) { 
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { 
                elem.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    function updateFullscreenButtonIcon(clockElement) {
        const iconElement = clockElement.querySelector('.fullscreen-btn i');
        if (!iconElement) return;

        if (document.fullscreenElement === clockElement) {
            iconElement.classList.remove('fa-expand');
            iconElement.classList.add('fa-compress');
            iconElement.parentElement.title = "전체화면 종료";
            clockElement.classList.add('clock-fullscreen-active');
        } else {
            iconElement.classList.remove('fa-compress');
            iconElement.classList.add('fa-expand');
            iconElement.parentElement.title = "전체화면 전환";
            clockElement.classList.remove('clock-fullscreen-active');
        }
    }

            function createClockElement(city, containerId, isCustom = false) {
        const container = document.createElement("div");
        container.className = "clock-container";
        container.dataset.city = city.name; 
        container.dataset.continent = city.continent;

        const flag = document.createElement("img");
        // SVG 국기 이미지 URL로 변경 (이전 요청에 따라)
        flag.src = `https://flagcdn.com/${city.flag}.svg`; 
        flag.alt = `${city.name} 국기`;
        flag.loading = "lazy";

        const cityNameH2 = document.createElement("h2");
        cityNameH2.appendChild(flag);
        cityNameH2.append(` ${city.name}`); 

        const timeDiv = document.createElement("div");
        timeDiv.className = "clock-time";
        timeDiv.style.color = continentColorsKo[city.continent] || "#000"; 

        const dateDiv = document.createElement("div"); 
        dateDiv.className = "clock-date";

        if (isCustom) {
            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-clock";
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.setAttribute("aria-label", `${city.name} 시계 제거`);
            removeBtn.title = `${city.name} 시계 제거`;
            container.appendChild(removeBtn);

            const fullscreenBtn = document.createElement("button");
            fullscreenBtn.className = "fullscreen-btn";
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            fullscreenBtn.setAttribute("aria-label", `${city.name} 전체화면 전환`);
            fullscreenBtn.title = "전체화면 전환";
            fullscreenBtn.addEventListener("click", (e) => {
                e.stopPropagation(); 
                toggleFullScreen(container);
            });
            container.appendChild(fullscreenBtn);
        }

        // 요소 추가 순서: 도시이름 -> 시간 -> 날짜
        container.append(cityNameH2, timeDiv, dateDiv); 
        const targetContainerElement = document.getElementById(containerId);
        if (targetContainerElement) {
            targetContainerElement.appendChild(container);
        } else {
            console.error(`컨테이너 ID '${containerId}'를 찾을 수 없습니다!`);
            return null; 
        }

        function updateClockTime() {
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            const localTime = new Date(utc + city.offset * 3600000); 
            const hours = String(localTime.getHours()).padStart(2, "0");
            const minutes = String(localTime.getMinutes()).padStart(2, "0");
            const seconds = String(localTime.getSeconds()).padStart(2, "0");
            
            // "2024년 7월 26일" 형식으로 날짜 부분 가져오기
            const formattedDatePart = localTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
            // "화요일" 형식으로 요일 부분 가져오기
            const dayOfWeek = localTime.toLocaleDateString('ko-KR', { weekday: 'long' });
            
            // 날짜와 요일을 조합하여 표시 (예: "2024년 7월 26일 화요일")
            dateDiv.textContent = `${formattedDatePart} ${dayOfWeek}`;
            
            timeDiv.innerHTML = `${hours}:${minutes}<span class="seconds">:${seconds}</span>`;
        }

        updateClockTime(); 
        const intervalId = setInterval(updateClockTime, 1000); 
        container.dataset.intervalId = intervalId; 

        // createClock 함수의 반환 값은 기존 코드에 따라 달라질 수 있습니다.
        // 만약 이전 코드에서 { clock: container } 형태로 반환했다면 아래와 같이 수정:
        // return { clock: container };
        // 만약 container DOM 요소 자체를 반환했다면 아래 코드가 맞습니다.
        return container; 
    }



    function initializeClocks() {
        const clocksContainer = document.getElementById("clocks-container");
        if (!clocksContainer) return;
        
        allClocks.forEach(clockEl => clearInterval(clockEl.dataset.intervalId));
        clocksContainer.innerHTML = ""; 
        allClocks = []; 
        displayedClocks = 0;

        const loadMoreBtn = document.getElementById("load-more");
        if (loadMoreBtn) loadMoreBtn.disabled = true; 

        const activeContinentFilter = document.querySelector(".filter-btn.active")?.dataset.continent;
        let filteredCities = cities;

        let initialLoadCount = clocksPerLoad;
        try {
            const savedCount = sessionStorage.getItem(displayedClocksKey);
            console.log(`[index.js] initializeClocks: sessionStorage에서 "${displayedClocksKey}" 키로 가져온 값:`, savedCount, `(타입: ${typeof savedCount})`); 
            if (savedCount !== null && savedCount !== undefined) { 
                const parsedCount = parseInt(savedCount, 10);
                console.log(`[index.js] initializeClocks: parsedCount from sessionStorage:`, parsedCount, `(타입: ${typeof parsedCount})`);
                if (!isNaN(parsedCount) && parsedCount > 0) { 
                    initialLoadCount = parsedCount;
                    console.log(`[index.js] sessionStorage에서 표시할 시계 개수 복원: ${initialLoadCount}`);
                } else {
                    console.log(`[index.js] initializeClocks: parsedCount (${parsedCount}) is not a valid number > 0. Defaulting to clocksPerLoad.`);
                }
            }
        } catch (e) {
            console.error('[index.js] sessionStorage에서 시계 개수 로드 실패:', e);
        }

        if (activeContinentFilter && activeContinentFilter !== "") {
            filteredCities = cities.filter(city => city.continent === activeContinentFilter);
        }

        const chunk = filteredCities.slice(0, initialLoadCount);

        for (const city of chunk) {
            const clockElement = createClockElement(city, "clocks-container");
            if (clockElement) allClocks.push(clockElement);
        }
        displayedClocks = chunk.length; 
        console.log(`[index.js] initializeClocks: 최종 displayedClocks: ${displayedClocks}, initialLoadCount: ${initialLoadCount}`);

        if (loadMoreBtn) {
            loadMoreBtn.style.display = displayedClocks >= filteredCities.length ? 'none' : 'flex';
            loadMoreBtn.disabled = displayedClocks >= filteredCities.length;
        }
        filterClocksVisibility(); 
        bindClockClickEvents(); 
    }

    function loadMoreClocks() {
        const loadMoreBtn = document.getElementById("load-more");
        if (loadMoreBtn) loadMoreBtn.disabled = true; 

        const activeContinentFilter = document.querySelector(".filter-btn.active")?.dataset.continent;
        let cityPool = cities; 
        if (activeContinentFilter && activeContinentFilter !== "") {
            cityPool = cities.filter(city => city.continent === activeContinentFilter);
        }

        const chunk = cityPool.slice(displayedClocks, displayedClocks + clocksPerLoad);

        for (const city of chunk) {
            const clockElement = createClockElement(city, "clocks-container");
            if (clockElement) allClocks.push(clockElement);
        }
        displayedClocks += chunk.length;
        console.log(`[index.js] "더 보기" 클릭 후 displayedClocks 값 (저장 전): ${displayedClocks}`);
        try {
            sessionStorage.setItem(displayedClocksKey, displayedClocks.toString());
            console.log(`[index.js] "더 보기" 후 sessionStorage에 시계 개수 저장 완료: ${displayedClocksKey} = ${displayedClocks}`);
        } catch (e) { 
            console.error('[index.js] sessionStorage에 시계 개수 저장 실패 (더 보기):', e);
        }


        if (loadMoreBtn) {
            loadMoreBtn.style.display = displayedClocks >= cityPool.length ? 'none' : 'flex';
            loadMoreBtn.disabled = displayedClocks >= cityPool.length;
        }
        filterClocksVisibility(); 
        bindClockClickEvents(); 
    }

    function createFilterButtons() {
        const uniqueContinents = [...new Set(cities.map(city => city.continent))].sort();
        
        const filterButtonData = [{ key: "", name: "전체" }];
        uniqueContinents.forEach(continentName => {
            if (continentName) { 
                 filterButtonData.push({ key: continentName, name: continentName });
            }
        });

        const filterContainer = document.getElementById("filter-buttons");
        if (!filterContainer) return;

        filterContainer.innerHTML = ""; 
        filterButtonData.forEach(item => {
            const button = document.createElement("button");
            button.className = "filter-btn";
            button.dataset.continent = item.key; 
            button.textContent = item.name;
            button.addEventListener("click", () => {
                document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");
                initializeClocks(); 
            });
            filterContainer.appendChild(button);
        });

        if (filterContainer.firstChild) {
            filterContainer.firstChild.classList.add("active");
        }
    }

    function filterClocksVisibility() {
        const searchInput = document.getElementById("search");
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";

        allClocks.forEach(clockElement => {
            if (!clockElement || !clockElement.dataset) return; 
            const cityNameKo = clockElement.dataset.city.toLowerCase(); 

            const matchesSearch = searchQuery === "" || cityNameKo.includes(searchQuery);
            clockElement.style.display = matchesSearch ? "block" : "none";
        });
    }

    function setupSearch() {
        const searchInput = document.getElementById("search");
        const messageContainer = document.getElementById("main-search-message"); 

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                const query = searchInput.value.toLowerCase().trim();
                const englishRegex = /[a-zA-Z]/;

                if (query.length > 0 && englishRegex.test(query)) {
                    if (messageContainer) {
                        messageContainer.textContent = "한글로 검색해주세요.";
                    }
                    allClocks.forEach(clockElement => { 
                        if(clockElement && clockElement.style) { 
                            clockElement.style.display = "none";
                        }
                    });
                } else {
                    if (messageContainer) {
                        messageContainer.textContent = ""; 
                    }
                    filterClocksVisibility(); 
                }
            });
        }
    }


    function saveCustomClocksToLocalStorage() {
        const clockNames = customClocksData.map(city => city.name); 
        localStorage.setItem('customClocksKo', JSON.stringify(clockNames));
    }

    function loadCustomClocksFromLocalStorage() {
        const savedNames = localStorage.getItem('customClocksKo');
        if (savedNames) {
            try {
                const cityNames = JSON.parse(savedNames);
                return cityNames
                    .map(name => cities.find(c => c.name === name)) 
                    .filter(city => city); 
            } catch (e) {
                console.error('localStorage에서 사용자 정의 시계 데이터 파싱 오류:', e);
                return [];
            }
        }
        return []; 
    }
    
    function initializeCustomClocks() {
        customClocksData = loadCustomClocksFromLocalStorage();
        const customClocksContainer = document.getElementById("custom-clocks-container");
        
        if (customClocksContainer) {
            customClocksContainer.querySelectorAll('.clock-container').forEach(clockEl => {
                clearInterval(clockEl.dataset.intervalId);
            });
            customClocksContainer.innerHTML = "";
        } else {
            console.error("'custom-clocks-container'를 찾을 수 없습니다.");
            return;
        }

        if (customClocksData.length === 0 && cities.length > 0) {
            const defaultCityNames = ["서울"]; 
            defaultCityNames.forEach(cityName => {
                const city = cities.find(c => c.name === cityName);
                if (city && !customClocksData.some(c => c.name === cityName)) {
                    customClocksData.push(city);
                }
            });
        }

        customClocksData.forEach(city => {
            renderSingleCustomClock(city); 
        });
        updateCustomClockCountDisplay();
        bindClockClickEvents(); 
    }
    
    function renderSingleCustomClock(city) {
        const clockElement = createClockElement(city, "custom-clocks-container", true);
        if (clockElement) {
            const removeBtn = clockElement.querySelector(".remove-clock");
            if (removeBtn) {
                removeBtn.addEventListener("click", (e) => {
                    e.stopPropagation(); 
                    clearInterval(clockElement.dataset.intervalId); 
                    customClocksData = customClocksData.filter(c => c.name !== city.name); 
                    clockElement.remove(); 
                    updateCustomClockCountDisplay();
                    saveCustomClocksToLocalStorage();
                });
            }
        }
    }

    function addCityToCustomClocks(city) {
        if (customClocksData.length >= 6) {
            alert("최대 6개의 시계만 추가할 수 있습니다!");
            return;
        }
        if (customClocksData.some(c => c.name === city.name)) { 
            alert("이미 추가된 도시입니다!");
            return;
        }

        customClocksData.push(city); 
        renderSingleCustomClock(city); 
        updateCustomClockCountDisplay();
        saveCustomClocksToLocalStorage();

        const searchInput = document.getElementById("custom-city-search");
        if (searchInput) searchInput.value = "";
        const suggestionsContainer = document.getElementById("custom-suggestions");
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = "";
            suggestionsContainer.style.display = "none";
        }
        bindClockClickEvents(); 
    }

    function clearAllCustomClocks() {
        const customClocksContainer = document.getElementById("custom-clocks-container");
        if (customClocksContainer) {
            customClocksContainer.querySelectorAll('.clock-container').forEach(clockEl => {
                clearInterval(clockEl.dataset.intervalId); 
            });
            customClocksContainer.innerHTML = ""; 
        }
        customClocksData = []; 
        saveCustomClocksToLocalStorage();
        updateCustomClockCountDisplay();
    }

    function updateCustomClockCountDisplay() {
        const countElement = document.querySelector(".clock-count");
        if (countElement) {
            countElement.textContent = `${customClocksData.length}/6 개 시계 추가됨`;
        }
    }

    function setupCustomCitySearch() {
        const searchInput = document.getElementById("custom-city-search");
        const suggestionsContainer = document.getElementById("custom-suggestions");
        if (!searchInput || !suggestionsContainer) return;

        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            suggestionsContainer.innerHTML = ""; 
            suggestionsContainer.style.display = query.length >= 1 ? "block" : "none"; 

            const englishRegex = /[a-zA-Z]/;
            if (query.length >= 1 && englishRegex.test(query)) {
                suggestionsContainer.innerHTML = "<div style='padding:10px; color: #e87000;'>한글로 검색해주세요.</div>";
                suggestionsContainer.style.display = "block"; 
                return; 
            }

            if (query.length >= 1) { 
                const matches = cities.filter(city => {
                    if (typeof city.name === 'string') {
                        return city.name.toLowerCase().includes(query);
                    }
                    return false; 
                });

                if (matches.length === 0) {
                    suggestionsContainer.innerHTML = "<div style='padding:10px;'>검색 결과가 없습니다</div>";
                } else {
                    matches.slice(0, 10).forEach(city => { 
                        const suggestionDiv = document.createElement("div");
                        suggestionDiv.innerHTML = `<img src="https://flagcdn.com/16x12/${city.flag}.png" alt="${city.name} 국기"> ${city.name}`;
                        suggestionDiv.addEventListener("click", () => {
                            addCityToCustomClocks(city);
                        });
                        suggestionsContainer.appendChild(suggestionDiv);
                    });
                }
            }
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && searchInput.value.trim()) {
                const query = searchInput.value.toLowerCase().trim();
                
                const englishRegex = /[a-zA-Z]/;
                if (englishRegex.test(query)) {
                    return; 
                }

                const firstMatch = cities.find(c => c.name.toLowerCase().includes(query));
                if (firstMatch) {
                     addCityToCustomClocks(firstMatch);
                } else {
                    alert("해당 도시를 찾을 수 없습니다. 정확한 도시명을 입력해주세요.");
                }
            }
        });

        document.addEventListener("click", (e) => {
            if (suggestionsContainer && !searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.style.display = "none";
            }
        });
    }

    
    function handleAddCustomClockButtonClick() {
        const searchInput = document.getElementById("custom-city-search");
        const suggestionsContainer = document.getElementById("custom-suggestions");

        if (!searchInput || !searchInput.value.trim()) {
            alert("추가할 도시 이름을 입력해주세요.");
            return;
        }
        const cityName = searchInput.value.trim();
        const query = cityName.toLowerCase();
        let city = cities.find(c => c.name.toLowerCase() === query); 

        if (!city) { 
            city = cities.find(c => c.name.toLowerCase().includes(query));
        }

        if (city) {
            addCityToCustomClocks(city); 
        } else {
            alert(`'${cityName}' 도시를 찾을 수 없습니다. 검색 제안 목록에서 선택하거나 정확한 이름을 입력해주세요.`);
            if (searchInput) searchInput.value = "";
            if (suggestionsContainer) {
                suggestionsContainer.innerHTML = "";
                suggestionsContainer.style.display = "none";
            }
        }
    }

    function bindClockClickEvents() {
        const clockElements = document.querySelectorAll('#custom-clocks-container .clock-container, #clocks-container .clock-container');
        
        const handleClick = (e) => {
            if (e.target.closest('button.remove-clock') || e.target.closest('button.fullscreen-btn')) {
                return;
            }

            const clockContainer = e.currentTarget; 
            const cityName = clockContainer.dataset.city?.trim(); 

            console.log('[index.js] handleClick: Clicked clock dataset.city:', clockContainer.dataset.city, 'Trimmed cityName:', cityName);

            if (!cityName) { 
                console.error('[index.js] handleClick: 도시 이름이 비어있거나 유효하지 않아 상세 페이지로 이동할 수 없습니다. dataset.city 값:', clockContainer.dataset.city);
                alert('선택한 시계의 도시 정보가 올바르지 않아 상세 정보를 표시할 수 없습니다.');
                return;
            }

            const cityInfoUrl = `city-info.html?도시=${encodeURIComponent(cityName)}`; 
            console.log(`[index.js] handleClick: 현재 displayedClocks 값 (저장 전): ${displayedClocks}`);
            try {
                sessionStorage.setItem(displayedClocksKey, displayedClocks.toString());
                console.log(`[index.js] 페이지 이동 전 sessionStorage에 시계 개수 저장 완료: ${displayedClocksKey} = ${displayedClocks}`);
            } catch (e) { 
                console.error('[index.js] sessionStorage에 시계 개수 저장 실패 (페이지 이동 전):', e);
            }
            console.log('[index.js] handleClick: Navigating to URL:', cityInfoUrl);
            window.location.href = cityInfoUrl;
        };

        clockElements.forEach(clock => {
            clock.removeEventListener('click', handleClick);
            clock.addEventListener('click', handleClick);
        });
    }
    
    function observeClockContainersForEvents() {
        const mainClocksContainer = document.getElementById('clocks-container');
        const customClocksContainer = document.getElementById('custom-clocks-container');

        const callback = function(mutationsList, observer) {
            for(const mutation of mutationsList) {
                if (mutation.type === 'childList') { 
                    bindClockClickEvents(); 
                }
            }
        };

        const observerConfig = { childList: true, subtree: false }; 

        if (mainClocksContainer) {
            const mainObserver = new MutationObserver(callback);
            mainObserver.observe(mainClocksContainer, observerConfig);
        }
        if (customClocksContainer) {
            const customObserver = new MutationObserver(callback);
            customObserver.observe(customClocksContainer, observerConfig);
        }
    }

    if (document.getElementById("clocks-container")) {
        createFilterButtons();
        setupSearch(); 
        initializeClocks(); 
        const loadMoreBtn = document.getElementById("load-more");
        if (loadMoreBtn) loadMoreBtn.addEventListener("click", loadMoreClocks);
    }

    if (document.getElementById("custom-clocks-section")) {
        initializeCustomClocks(); 
        setupCustomCitySearch();
        const addButton = document.getElementById("add-custom-clock");
        const clearButton = document.getElementById("clear-custom-clocks");
        if (addButton) {
            addButton.addEventListener("click", handleAddCustomClockButtonClick);
        }
        if (clearButton) {
            clearButton.addEventListener("click", clearAllCustomClocks);
        }
    }
    
    observeClockContainersForEvents(); 
    bindClockClickEvents(); 

    document.addEventListener('fullscreenchange', () => {
        const allClockElements = document.querySelectorAll('.clock-container .fullscreen-btn'); 
        allClockElements.forEach(btn => {
            updateFullscreenButtonIcon(btn.closest('.clock-container'));
        });
    });
    ['webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(eventType =>
        document.addEventListener(eventType, () => document.dispatchEvent(new Event('fullscreenchange')), false)
    );
});
