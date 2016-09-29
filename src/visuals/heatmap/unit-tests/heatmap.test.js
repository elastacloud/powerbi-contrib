describe('Heatmap', function() {

    var testData = [{"timestamp": "2014-09-25T00:00:00", "value": {"PM2.5": 30.22}}, {"timestamp": "2014-09-25T01:00:00", "value": {"PM2.5": 41.61}}, {"timestamp": "2014-09-25T02:00:00", "value": {"PM2.5": 50.71}}, {"timestamp": "2014-09-25T03:00:00", "value": {"PM2.5": 57.34}}, {"timestamp": "2014-09-25T04:00:00", "value": {"PM2.5": 79.64}}, {"timestamp": "2014-09-25T05:00:00", "value": {"PM2.5": 76.93}}, {"timestamp": "2014-09-25T06:00:00", "value": {"PM2.5": 106.45}}, {"timestamp": "2014-09-25T07:00:00", "value": {"PM2.5": 79.72}}, {"timestamp": "2014-09-25T08:00:00", "value": {"PM2.5": 74.23}}, {"timestamp": "2014-09-25T09:00:00", "value": {"PM2.5": 90.48}}, {"timestamp": "2014-09-25T10:00:00", "value": {"PM2.5": 94.74}}, {"timestamp": "2014-09-25T11:00:00", "value": {"PM2.5": 85.97}}, {"timestamp": "2014-09-25T12:00:00", "value": {"PM2.5": 69.23}}, {"timestamp": "2014-09-25T13:00:00", "value": {"PM2.5": 82.63}}, {"timestamp": "2014-09-25T14:00:00", "value": {"PM2.5": 244.89}}];


    var svg;
    function renderSvg() {
        svg = d3.select('body')
            .append('div')
            .attr('class', 'days-hours-heatmap')
            .append('svg')
            .attr('width', 800)
            .attr('height', 800)
            .attr('class', 'heatmap')
            .append('g')
            .attr("transform", "translate(0, 0)");
    }

    renderSvg();

    var heatmap = new powerbi.visuals.Heatmap('.heatmap');
    heatmap.update(testData);


    describe('the svg' ,function() {

        function getSvg() {
            console.log(d3.select('.heatmap'))
            return d3.select('.heatmap');
        }

        it('should be created', function() {
            expect(getSvg()).not.toBeNull();
        });

        it('should have the correct height', function() {
            expect(getSvg().attr('width')).toBe('800');
        });

        it('should have the correct width', function() {
            expect(getSvg().attr('width')).toBe('800');
        });

    });

    describe('test Axis creation', function() {
        //TODO:  move helpers into a single file
        function getXAxis() {
            return d3.select('.x.axis');
        }
        function getYAxis() {
            return d3.selectAll('.y.axis')[0];
        }

        it('should create a xAxis', function() {
            var axis = getXAxis()[0];
            expect(axis.length).toBe(1);
        });

        it('should create a yAxis', function() {
            var axis = getYAxis();
            expect(axis.length).toBe(1);
        });
    });

    describe('test rect creation', function() {

        //TODO:  move helpers into a single file
        function getRects() {

            return d3.selectAll('rect')[0];
        }


        it('should be created correct count', function() {
            expect(getRects().length > 1).toBeTruthy();

        });
    });
});