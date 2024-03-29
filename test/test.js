'use strict';

const assert = require('assert');
const QS = require('../lib/querystring.js');

describe( 'Tests', ( done ) =>
{
    it('should parse query string', function()
	{
        assert.deepStrictEqual( QS.parse( 'foo=bar' ), { foo: 'bar' });
        assert.deepStrictEqual( QS.parse( 'foo=bar&bar=foo' ), { foo: 'bar', bar: 'foo' });
    });

    it('should parse query starting with &', function()
	{
        assert.deepStrictEqual( QS.parse( 'foo=bar&bar=foo&' ), { foo: 'bar', bar: 'foo' });
        assert.deepStrictEqual( QS.parse( '&foo=bar&bar=foo' ), { foo: 'bar', bar: 'foo' });
        assert.deepStrictEqual( QS.parse( '&foo=bar&bar=foo&' ), { foo: 'bar', bar: 'foo' });
    });

    it('should parse empty query', function()
	{
        assert.deepStrictEqual( QS.parse('&'), {});
        assert.deepStrictEqual( QS.parse('='), {});
        assert.deepStrictEqual( QS.parse('&=&='), {});
    });

    it('should parse empty values', function()
	{
        assert.deepStrictEqual( QS.parse('foo'), { foo: null });
        assert.deepStrictEqual( QS.parse('foo&bar'), { foo: null, bar: null });
        assert.deepStrictEqual( QS.parse('foo&bar&'), { foo: null, bar: null });
        assert.deepStrictEqual( QS.parse('foo='), { foo: '' });
        assert.deepStrictEqual( QS.parse('foo&'), { foo: null });
        assert.deepStrictEqual( QS.parse('foo=&'), { foo: '' });
        assert.deepStrictEqual( QS.parse('foo=&bar='), { foo: '', bar: '' });
        assert.deepStrictEqual( QS.parse('foo=&bar=&'), { foo: '', bar: '' });
        assert.deepStrictEqual( QS.parse('foo=&bar&'), { foo: '', bar: null });
        assert.deepStrictEqual( QS.parse('foo=&bar=foo'), { foo: '', bar: 'foo' });
        assert.deepStrictEqual( QS.parse('foo&bar=foo'), { foo: null, bar: 'foo' });
    });

    it('should parse arrays', function()
	{
        assert.deepStrictEqual( QS.parse('foo=a&foo=b'), { foo: [ 'a', 'b' ] });
        assert.deepStrictEqual( QS.parse('foo[]=a&foo[]=b'), { foo: [ 'a', 'b' ] });
        assert.deepStrictEqual( QS.parse('foo[]=a&foo[1]=b'), { foo: [ 'a', 'b' ] });
        assert.deepStrictEqual( QS.parse('foo[0]=a&foo[1]=b'), { foo: [ 'a', 'b' ] });
        assert.deepStrictEqual( QS.parse('foo[1]=a&foo[0]=b'), { foo: [ 'b', 'a' ] });
        assert.deepStrictEqual( QS.parse('foo[bar]=a&foo[bar]=b'), { foo: { bar: [ 'a', 'b' ] }});
        assert.deepStrictEqual( QS.parse('foo[bar][]=a&foo[bar][]=b'), { foo: { bar: [ 'a', 'b' ] }});
        assert.deepStrictEqual( QS.parse('foo[bar][0]=a&foo[bar][1]=b'), { foo: { bar: [ 'a', 'b' ] }});
        assert.deepStrictEqual( QS.parse('foo[bar][1]=a&foo[bar][0]=b'), { foo: { bar: [ 'b', 'a' ] }});
        assert.deepStrictEqual( QS.parse('foo[bar][0]=a&foo[bar]=b'), { foo: { bar: [ 'a', 'b' ]}});
        assert.deepStrictEqual( QS.parse('foo[bar][foo]=a&foo[bar]=b'), { foo: { bar: { foo: 'a', '0' : 'b' }}});
        assert.deepStrictEqual( QS.parse('foo[][foo]=a&foo[][bar]=b&foo[][foo]=c&foo[][bar]=d'), { foo: [{ foo: 'a', bar: 'b' }, { foo: 'c', bar: 'd' }]});
    });

    it('should parse objects', function()
	{
        assert.deepStrictEqual( QS.parse('foo[bar]=a'), { foo: { bar: 'a' }});
        assert.deepStrictEqual( QS.parse('foo[bar]=a&foo[]=b'), { foo: { bar: 'a', '0': 'b' }});
        assert.deepStrictEqual( QS.parse('foo[bar]=a&foo[]=b&foo[]=c'), { foo: { bar: 'a', '0': 'b', '1': 'c' }});
        assert.deepStrictEqual( QS.parse('foo[]=b&foo[bar]=a&foo[]=c'), { foo: { bar: 'a', '0': 'b', '1': 'c' }});
    });

    it('should decode keys and values', function()
	{
        assert.deepStrictEqual( QS.parse('foo+bar=bar+foo'), { 'foo bar': 'bar foo' });
        assert.deepStrictEqual( QS.parse('foo+bar'), { 'foo bar': null });
        assert.deepStrictEqual( QS.parse('foo+bar='), { 'foo bar': '' });
        assert.deepStrictEqual( QS.parse('foo+bar=+'), { 'foo bar': ' ' });
    });

    it('should parse typed values', function()
	{
        assert.deepStrictEqual( QS.parse('foo[]=1&foo[]=-1.5&foo[]=true&foo[]=false&foo[]=undefined&foo[]=null&foo[]=bar', { types: [ 'null', 'undefined', 'boolean', 'number' ]}), { 'foo': [ 1, -1.5, true, false, undefined, null, 'bar' ]});
    });

    it('should stringify query', function()
	{
        let querystring = QS.stringify({ bar: true, foo: { foo: false, bar: 'foobar' }, arr: [ 'foo', { foo: 'bar' }, null, 321, undefined, 123.45, undefined ]});

        assert.deepStrictEqual( querystring, 'bar=1&foo[foo]=0&foo[bar]=foobar&arr[0]=foo&arr[1][foo]=bar&arr[2]&arr[3]=321&arr[5]=123.45' );
        assert.deepStrictEqual( QS.parse( querystring ), { bar: '1', foo: { foo: '0', bar: 'foobar' }, arr: [ 'foo', { foo: 'bar' }, null, '321', , '123.45' ]});
    });
    
    it('should parse cookies', function()
	{
        assert.deepStrictEqual( QS.parseCookies(''), {});
        assert.deepStrictEqual( QS.parseCookies(), {});
        assert.deepStrictEqual( QS.parseCookies(undefined), {});
        assert.deepStrictEqual( QS.parseCookies(null), {});
        assert.deepStrictEqual( QS.parseCookies('    '), {});
        assert.deepStrictEqual( QS.parseCookies('foo=bar'), { 'foo': 'bar' });
        assert.deepStrictEqual( QS.parseCookies('  foo  =   bar    '), { 'foo': 'bar' });
        assert.deepStrictEqual( QS.parseCookies('foo=bar; '), { 'foo': 'bar' });
        assert.deepStrictEqual( QS.parseCookies('foo=bar; bar'), { 'foo': 'bar' });
        assert.deepStrictEqual( QS.parseCookies('foo=bar; bar = foo'), { 'foo': 'bar', 'bar': 'foo' });
        assert.deepStrictEqual( QS.parseCookies('foo=bar; bar = foo;'), { 'foo': 'bar', 'bar': 'foo' });
    });
});
