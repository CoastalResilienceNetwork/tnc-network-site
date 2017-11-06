'use strict';

var $ = window.$;
var L = window.L;
var _ = window._;
var Backbone = window.Backbone;

var MarkerPopupView = Backbone.View.extend({
    template: _.template($('#markerPopupTemplate').html()),

    render: function() {
        this.$el.html(this.template(this.model));

        return this;
    },
});

window.MapView = Backbone.View.extend({
    el: '#map',

    initialize: function(options) {
        this.map = null;
        this.slideOutStatsRegion = options.slideOutStatsRegion;
        this.listenTo(this.model, 'change:selectedRegion', this.panBaseMap);
        this.listenTo(this.model, 'change:selectedRegion', this.updateMarkers);
        this.listenToOnce(this.model, 'change:statsVisible', this.resetMapSize);
        this.markers = L.layerGroup();

        // Custom icon for markers
        this.icon = L.icon({
            iconUrl: 'assets/images/marker.png',
            iconSize: [25, 34]
        });
    },

    render: function() {
        var map = L.map('map', {
            center: this.model.get('initialMapCenter'),
            zoom: this.model.get('initialMapZoom'),
        });

        L.tileLayer(this.model.get('baseMapTilesUrl'), {
            attribution: this.model.get('baseMapTilesAttribution'),
            minZoom: this.model.get('baseMapTilesMinZoom'),
            maxZoom: this.model.get('baseMapTilesMaxZoom'),
            ext: 'png',
        }).addTo(map);

        L.esri.dynamicMapLayer({
            url: this.model.get('regionLayerUrl'),
            opacity: this.model.get('regionLayerOpacity'),
        }).addTo(map);

        this.map = map;
        this.map.once('moveend', this.slideOutStatsRegion);
        this.map.createPane('selectedMarker');

        return this;
    },

    panBaseMap: function() {
        var newCenter = this.model.get('selectedRegion') ?
            this.model.get('selectedRegion').get('mapCenter') :
            this.model.get('initialMapCenter');

        var newZoom = this.model.get('selectedRegion') ?
            this.model.get('selectedRegion').get('mapZoom') :
            this.model.get('initialMapZoom');

        this.map.flyTo(newCenter, newZoom);
    },

    resetMapSize: function() {
        var animate = true;
        if (this.map) {
            this.map.invalidateSize(animate);
        }
    },

    updateMarkers: function() {
        var subregions = null;

        if (this.model.get('selectedRegion')) {
            subregions = this.model.get('selectedRegion').get('subregions');

            if (subregions && subregions.length > 0) {
                _.forEach(subregions, function(region) {
                    if (region.mapCenter) {
                        this.markers.addLayer(this.createMarker(region));
                    }
                }, this);
            }

            this.map.addLayer(this.markers);
        } else {
            this.map.removeLayer(this.markers);
            this.markers.clearLayers();
        }
    },

    createMarker: function(region) {
        var offset = [0, 25]; // Marker is used as popup tip
        var popupContents = new MarkerPopupView({ model: region });
        var marker = L.marker(region.mapCenter, { icon: this.icon })
            .bindPopup(popupContents.render().el, { offset: offset });
        var markerCopy = null;

        // Adds a copy of the marker to the selectedMarker pane
        // so that it is displayed above the popup and acts as
        // the popup tip.
        marker.on('popupopen', _.bind(function(e) {
            markerCopy = L.marker(e.target.getLatLng(), {
                pane: 'selectedMarker', icon: this.icon
            });
            markerCopy.addTo(this.map);
        }, this));

        marker.on('popupclose', function() {
            markerCopy.remove();
        });

        marker.on('remove', function() {
            popupContents.remove();
        });

        return marker;
    }
});

window.RegionListView = Backbone.View.extend({
    el: '#region-list-view',

    template: _.template($('#regionListTemplate').html()),

    events: {
        'click': 'handleSelection',
    },

    render: function() {
        this.$el.html(this.template({ regionList: this.model.get('regionList') }));
        return this;
    },

    handleSelection: function(e) {
        this.model.showDetails(e.target.id);
    },
});

window.RegionDetailsView = Backbone.View.extend({
    el: '#region-details-view',

    template: _.template($('#regionDetailsTemplate').html()),

    events: {
        'click #close-details-btn': 'closeDetails',
    },

    initialize: function(options) {
        this.hideDetails = options.hideDetails;
    },

    render: function() {
        this.$el.html(this.template({
            title: this.model.get('title'),
            description: this.model.get('description'),
            image: this.model.get('image'),
            mapUrl: this.model.get('mapUrl'),
            subregions: this.model.get('subregions'),
        }));

        return this;
    },

    closeDetails: function() {
        this.hideDetails();
    },
});

window.StatsView = Backbone.View.extend({
    el: '#stats-region',

    template: _.template($('#statsViewTemplate').html()),

    render: function() {
        var statsList = this.model.get('statsList');
        // To ensure the app always shows 3 and only 3 stat items, take the
        // first three configured stat items if the number's >= 3; if there are
        // fewer than 3 configured stat items, add up to 3 placeholders.
        var statItems = statsList.length >= 3 ? _.take(statsList, 3) :
            statsList.concat(_.map(_.range(statsList.length, 3), function() {
                return {
                    label: 'Label',
                    stat: 1,
                    secondaryLabel: 'secondaryLabel',
                    description: 'description',
                };
            }));

        this.$el.html(this.template({
            statItems: statItems,
        }));

        return this;
    },
});
