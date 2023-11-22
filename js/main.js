let allKeys;
let colorsLegend;
let genocideData;

fetch('../colorsLegend.json')
  .then(response => response.json())
  .then(data => {
    colorsLegend = data;
    allKeys = colorsLegend.map((e) => e.value);
  });

  fetch('../genocideData.json')
  .then(response => response.json())
  .then(data => {
    genocideData = data;
  });

let currentYear = 2022;

const rangeBtns = [...document.querySelectorAll(".range__item-text")];

rangeBtns.forEach((e) => {
    e.addEventListener("click", () => {
        currentYear = +e.dataset.value;
        rangeBtns.forEach((btn) => {
            btn.classList.toggle("active");
        });
        document
            .querySelector("[data-custom-popup]")
            .classList.remove("opacity-0");

        map.off();
        map.remove();
        mount();
    });
});

document.querySelector("[data-close]").addEventListener("click", (e) => {
    document
        .querySelector("[data-custom-popup]")
        .classList.add("opacity-0");
    document.body.classList.remove('pin-disabled');
});

function drawSidebar(feature) {
    const name = feature.properties.SUBJECTO || feature.properties.NAME;
    const data = genocideData[currentYear].find((e) => e.country === name);
    let index = !data
        ? 0
        : allKeys.includes(data.value)
            ? allKeys.findIndex((key) => +data.value === +key)
            : allKeys.findIndex((key) => +data.value < +key) - 1;

    if (index < 0) {
        index = colorsLegend.length - 1;
    }

    document.querySelector("[data-popup-name]").innerHTML = name;
    document.querySelector("[data-popup-percent]").innerHTML = colorsLegend[index].caption;
   
    // document.querySelector("[data-popup-text]").innerHTML =
    //     colorsLegend[index].text;

    const html = data.quotes
        .map((quote) => {
            return `<div class="custom-popup-quote">
    <q class="custom-popup-quote-header">${quote.text}</q>
    <div class="custom-popup-quote-text">${quote.author}</div>
  </div>`;
        })
        .join("");
    document.querySelector("[data-popup-second]").innerHTML = html;

    document
        .querySelector("[data-custom-popup]")
        .classList.remove("opacity-0");
}

function mount() {
    document
        .querySelector("[data-custom-popup]")
        .classList.add("opacity-0");
    document.body.classList.remove('pin-disabled');

    const year = currentYear === 2022 ? 2010 : 1938;
    d3.json(`../geojson/world_${year}.geojson`)
        .then(function (data, error) {
            console.log(data);
            makeMap(data);
        })
        .then(function () {
            makeBlurFilter();
        });
}

mount();
var map, polygons;

function makeMap(data) {
    map = L.map("map", {
        zoomControl: true,
        maxZoom: 28,
        minZoom: 1,
    }).fitBounds([
        [-93.0414080258767, -111.06282314172664],
        [137.43642981196118, 140.9371768582734],
    ]);
    var hash = new L.Hash(map);

    var bounds_group = new L.featureGroup([]);
    function setBounds() { }

    function customTip() {
        this.unbindTooltip();
        if (!this.isPopupOpen())
            this.bindTooltip("Short description").openTooltip();
    }

    function customPop() {
        this.unbindTooltip();
    }

    let isRussiaWas = false;
    function featureInfo(feature, layer) {
        const name = feature.properties.SUBJECTO || feature.properties.NAME;
        const isIncluded = genocideData[currentYear].find(
            (e) => e.country === name
        );
        if (!isIncluded) {
            return;
        }

        const isRussia = ["Russia"].includes(isIncluded.country);
        const isUSSR = ["USSR"].includes(isIncluded.country);
        var popupContent = `<div class="tooltips"><div class="tooltips__left">
      <em class="tooltips__left_text">"${isIncluded.quotes[0].text}"</em>
      <span class="tooltips__left_author">${isIncluded.quotes[0].author}</span>
      <div><span class="tooltips__country">${name}</span></div>`;

        layer
            .on("mouseover", function () {
                this.unbindTooltip();
                if (!this.isPopupOpen()) {
                    this.bindTooltip(popupContent, { sticky: true }).openTooltip();
                }
            })
            .addTo(map);

        var label = L.marker(
            {
                lat: layer.getBounds().getCenter().lat,
                lng:
                    isRussia || isUSSR
                        ? layer.getBounds().getNorthEast().lng / 2
                        : layer.getBounds().getCenter().lng,
            },
            {
                icon: L.divIcon({
                    className:
                        (isRussia || isUSSR) && isRussiaWas ? "hidden" : "label",
                    html: isIncluded
                        ? `<span class="country"></span>`
                        : "",
                    iconSize: [100, 40],
                }),
            }
        ).addTo(map);

        layer
            .on("click", function (e) {
                document.body.classList.add('pin-disabled');
               
                drawSidebar(this.feature);
                if (isRussia || isUSSR) {
                    map.setView(
                        {
                            lat: this.getCenter().lat * 1.05,
                            lng: this.getBounds().getEast() / 2,
                        },
                        3
                    );
                } else {
                    map.setView(this.getCenter());
                }
            })
            .addTo(map);
        if (isRussia || isUSSR) {
            isRussiaWas = true;
        }
    }

    // COLORING
    const colors = d3.scaleOrdinal(d3.schemePaired);
    let categories = [
        ...new Set(
            data.features.map((d) => d.properties.SUBJECTO || d.properties.NAME)
        ),
    ];
    categories = categories.sort((a, b) => 0.5 - Math.random());
    function featureStyle(feature) {
        let name = feature.properties.SUBJECTO || feature.properties.NAME;
        const isIncluded = genocideData[currentYear].find(
            (e) => e.country === name
        );

        let index = !isIncluded
            ? 0
            : allKeys.includes(isIncluded.value)
                ? allKeys.findIndex((key) => +isIncluded.value === +key)
                : allKeys.findIndex((key) => +isIncluded.value < +key) - 1;

        if (index < 0) {
            index = colorsLegend.length - 1;
        }

        const color = colorsLegend[index].color;

        return {
            pane: "polygons",
            opacity: 1,
            color: "#000",
            weight: 0.2,
            dashArray: "",
            lineCap: "butt",
            lineJoin: "miter",
            filter: "ulr(#inset-shadow)", // does not work yet
            fill: true,
            fillOpacity: 1,
            fillColor: color,
            className: isIncluded ? "data-exists item" : "item",
        };
    }
    map.createPane("polygons");
    polygons = map.getPane("polygons");
    polygons.style.zIndex = 401;
    polygons.style["mix-blend-mode"] = "normal";

    var layer_cntry2000bc_02_1 = new L.geoJson(data, {
        attribution: '<a href=""></a>',
        pane: "polygons",
        onEachFeature: featureInfo,
        style: featureStyle,
    });
    bounds_group.addLayer(layer_cntry2000bc_02_1);
    map.addLayer(layer_cntry2000bc_02_1);
    setBounds();
}



/** Making blury polgyons
 * @see https://stackoverflow.com/questions/28235792/leaflet-polygon-with-fuzzy-outline
 */
function makeBlurFilter() {
    // console.log(svg);
    var svgFilter = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "filter"
    );
    var svgBlur = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feGaussianBlur"
    );
    const svgOffset = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feOffset"
    );
    var svgComposite = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feComposite"
    );
    var svgComposite2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feComposite"
    );
    var svgComposite3 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feComposite"
    );
    const svgFlood = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "feFlood"
    );
    // Set ID attribute of filter
    svgFilter.setAttribute("id", "blur");
    // Give room to blur to prevent clipping

    // Set deviation attribute of blur
    svgBlur.setAttribute("stdDeviation", 10);
    svgBlur.setAttribute("result", "offset-blur");

    svgOffset.setAttribute("dx", "0");
    svgOffset.setAttribute("dy", "0");

    svgComposite.setAttribute("in", "SourceGraphic");
    svgComposite.setAttribute("in2", " offset-blur");
    svgComposite.setAttribute("result", "inverse");
    svgComposite.setAttribute("operator", "out");

    svgFlood.setAttribute("floodColor", "black");
    svgFlood.setAttribute("floodOpacity", "0.5");
    svgFlood.setAttribute("result", "color");

    svgComposite2.setAttribute("operator", "in");
    svgComposite2.setAttribute("in", "color");
    svgComposite2.setAttribute("result", "shadow");
    svgComposite2.setAttribute("in2", "inverse");

    svgComposite3.setAttribute("operator", "over");
    svgComposite3.setAttribute("in", "shadow");
    svgComposite3.setAttribute("in2", "SourceGraphic");
    // Append blur element to filter element
    svgFilter.appendChild(svgOffset);
    svgFilter.appendChild(svgBlur);
    svgFilter.appendChild(svgComposite);
    svgFilter.appendChild(svgFlood);
    svgFilter.appendChild(svgComposite2);
    svgFilter.appendChild(svgComposite3);
    // Append filter element to SVG element
    let svg = document.getElementsByTagName("svg")[0];
    svg.appendChild(svgFilter);
}

