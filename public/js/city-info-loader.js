document.addEventListener('DOMContentLoaded', async () => {
    const cityDetailContainer = document.getElementById('city-detail-container');
    const loadingMessage = document.querySelector('.loading-message');

    if (!cityDetailContainer) {
        console.error('City detail container not found.');
        if (loadingMessage) loadingMessage.textContent = 'Error: Page layout components not found.';
        return;
    }

    console.log('[city-info-loader.js] Current page URL:', window.location.href);
    const urlParams = new URLSearchParams(window.location.search);
    let cityNameFromUrl = urlParams.get('도시'); 
    if (!cityNameFromUrl) { 
        cityNameFromUrl = urlParams.get('city');
    }
    console.log('[city-info-loader.js] cityNameFromUrl (from "도시" or "city" param):', cityNameFromUrl);

    if (!cityNameFromUrl) {
        cityDetailContainer.innerHTML = '<p>표시할 도시가 지정되지 않았습니다. URL에 ?도시=도시이름 형식으로 도시를 지정해주세요.</p>'; // 안내 메시지 한국어화
        document.title = "Error | WorldClocks";
        return;
    }

    const decodedCityName = decodeURIComponent(cityNameFromUrl);
    document.title = `Loading ${decodedCityName} Information... | WorldClocks`;
    if (loadingMessage) loadingMessage.textContent = `Loading detailed information for ${decodedCityName}...`;

    const jsonFiles = [
        '/data/json/cities1.json',
        '/data/json/cities2.json',
        '/data/json/cities3.json',
        '/data/json/cities4.json',
        '/data/json/cities5.json',

    ];
    let cityData = null;
    let foundInFile = null;

    try {
        for (const filePath of jsonFiles) {
            console.log(`Attempting to fetch city data for "${decodedCityName}" from ${filePath}`);
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    console.warn(`Failed to load ${filePath}. (Status: ${response.status}) - Will try next file.`);
                    continue; 
                }
                const citiesList = await response.json();
                console.log(`Successfully parsed ${filePath}, found ${citiesList.length} cities.`);
                
                cityData = citiesList.find(c => c.도시명?.trim().toLowerCase() === decodedCityName.toLowerCase());
                if (cityData) {
                    foundInFile = filePath;
                    console.log(`Found "${decodedCityName}" in ${foundInFile}`);
                    break; 
                }
            } catch (fileError) {
                console.error(`Error processing file ${filePath}:`, fileError.message, "- Will try next file.");
            }
        }

        if (cityData) {
            console.log('Found city data:', cityData);
            document.title = `${cityData.도시명} - 상세 정보 | 세계 시계`; 
            const metaDescTag = document.querySelector('meta[name="description"]');
            if (metaDescTag) {
                metaDescTag.setAttribute('content', `Find detailed information for ${cityData.도시명}, including timezone, standard business hours, major public holidays, business tips, and recommended attractions. Discover everything about ${cityData.도시명} on WorldClocks.`); // Use Korean key
            }

            const attractionsHtml = (cityData.전문가를위한최고명소 || []) 
                .map(attr => `<li><strong>${attr.명소명 || '정보 없음'}</strong>: ${attr.설명 || '정보 없음'} (비즈니스 지구와의 근접성: ${attr.비즈니스지구와의근접성 || '정보 없음'})</li>`) // Assuming Korean keys inside
                .join('');

            const eventsHtml = (cityData.네트워킹이벤트 || []) 
                .map(event => `<li><strong>${event.이벤트명 || '정보 없음'}</strong> (${event.날짜 || '날짜 정보 없음'}): ${event.설명 || '정보 없음'})</li>`) // Assuming Korean keys inside
                .join('');
            
            const holidaysHtml = (cityData.주요공휴일 || []) 
                .map(holiday => `<li>${holiday}</li>`).join('');

            cityDetailContainer.innerHTML = `
                <article class="city-info-content">
                    <h1>
                        <img src="https://flagcdn.com/w40/${cityData.국기?.toLowerCase()}.png" alt="${cityData.국가} 국기" style="margin-right: 10px; vertical-align: middle;">
                        ${cityData.도시명}
                    </h1>
                    <p><strong>국가:</strong> ${cityData.국가 || '정보 없음'}</p>
                    <p><strong>대륙:</strong> ${cityData.대륙 || '정보 없음'}</p>
                    <p><strong>시간대:</strong> ${cityData.시간대 || '정보 없음'} (${cityData.시간차이 || '정보 없음'})</p>
                    
                    <h2>일반 정보</h2>
                    <p><strong>표준 업무 시간:</strong> ${cityData.표준업무시간 || '정보 없음'}</p>
                    <p><strong>추천 회의 시간:</strong> ${cityData.추천회의시간 || '정보 없음'}</p>
                    
                    <h2>주요 공휴일</h2>
                    <ul>${holidaysHtml || '<li>공휴일 정보 없음.</li>'}</ul>
                    
                    <h2>비즈니스 환경</h2>
                    <p><strong>비즈니스 허브 정보:</strong> ${cityData.비즈니스중심지 || '정보 없음'}</p>
                    <p><strong>비즈니스 에티켓:</strong> ${cityData.비즈니스예절 || '정보 없음'}</p>
                    <p><strong>비즈니스 팁:</strong> ${cityData.비즈니스팁 || '정보 없음'}</p>
                    
                    <h2>현지 생활 및 문화</h2>
                    <p><strong>라이프스타일:</strong> ${cityData.지역생활방식 || '정보 없음'}</p>
                    <p><strong>문화 하이라이트:</strong> ${cityData.지역문화 || '정보 없음'}</p>
                    <p><strong>대표 음식:</strong> ${cityData.대표음식 || '정보 없음'}</p>
                    
                    <h2>전문가 추천 명소</h2>
                    <ul>${attractionsHtml || '<li>추천 명소 정보 없음.</li>'}</ul>
                    
                    <h2>네트워킹 이벤트</h2>
                    <ul>${eventsHtml || '<li>네트워킹 이벤트 정보 없음.</li>'}</ul>
                </article>
            `;
        } else {
            console.warn(`Information for '${decodedCityName}' not found in any of the checked JSON files.`);
            cityDetailContainer.innerHTML = `<p>Detailed information for '${decodedCityName}' could not be found. Please check the city name.</p>`;
            document.title = `Information Not Found | ${decodedCityName} | WorldClocks`;
        }
    } catch (error) {
        console.error('Error loading city details:', error);
        cityDetailContainer.innerHTML = `<p>An error occurred while loading information: ${error.message}. Please try again later.</p>`;
        document.title = "Error Loading Data | WorldClocks";
    }
});
