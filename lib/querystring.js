'use strict';

const sep = '&', eq = '=', del = ';';
const intRE = /^[0-9]+$/;

const Expand = ( data, querystring = [], prefix = '' ) =>
{
    if( data === null )
    {
        querystring.push( prefix );
    }
    else if( typeof data === 'boolean' )
    {
        querystring.push( prefix + '=' + ( data ? '1' : '0' ));
    }
    else if( typeof data === 'number' || typeof data === 'string' )
    {
        querystring.push( prefix + '=' + encodeURIComponent( data.toString() ));
    }
    else if( Array.isArray( data ))
    {
        for( let i = 0; i < data.length; ++i )
        {
            Expand( data[i], querystring, prefix + '[' + i + ']' );
        }
    }
    else if( typeof data === 'object' )
    {
        for( let key in data )
        {
            Expand( data[key], querystring, prefix ? prefix + '[' + key + ']' : key );
        }
    }

    return querystring;
}

function Value( value, types = [])
{
    if( value === 'null' && types.includes( 'null' )){ return null }
    if( value === 'undefined' && types.includes( 'undefined' )){ return undefined }
    if([ 'true', 'false' ].includes( value ) && types.includes( 'boolean' )){ return value === 'true' }
    if(/^[+-]?[0-9]+$/.test( value ) && types.includes( 'number' )){ return parseInt( value )}
    if(/^[+-]?([0-9]*\.[0-9]+)$/.test( value ) && types.includes( 'number' )){ return parseFloat( value )}

    return value;
}

const Query = new Proxy( Object, 
{
    construct: () =>
    {
        let query = {};

        Object.defineProperty( query, 'assign', { value: ( key, value, types ) =>
        {
            let keys = key.replace(/\]\[/g, '[').replace(/]$/,'').split('['), obj = query, parent, parent_key;
            
            types && ( value = Value( value, types ));

            for( let i = 0; i < keys.length; ++i )
            {
                if(( key = keys[i] ) && intRE.test( key )){ key = parseInt( keys[i] ); }
                else if( key === '' )
                {
                    key = Array.isArray( obj ) ? obj.length - 1 : Math.max( -1, ...Object.keys(obj).map( k => intRE.test(k) ? parseInt(k) : -1 ));

                    if( key === -1 || i === keys.length - 1 || obj[key]?.hasOwnProperty( keys[i+1] ))
                    {
                        key += 1;
                    }
                }

                if( typeof key === 'string' && Array.isArray( obj ))
                {
                    parent[parent_key] = obj = obj.reduce(( o, v, i ) => ( o[i] = v, o ), {});
                }

                if( i < keys.length - 1 )
                {
                    if( !obj[key] )
                    {
                        obj[key] = ( keys[i+1] === '' || intRE.test( keys[i+1] )) ? [] : {};
                    }

                    parent = obj;
                    parent_key = key;
                    obj = obj[key];
                }
                else
                {
                    if( obj[key] !== undefined )
                    {
                        if( Array.isArray( obj[key] ))
                        {
                            obj[key].push( value )
                        }
                        else if( typeof obj[key] === 'object' )
                        {
                            obj[key][ Math.max( -1, ...Object.keys(obj).map( k => intRE.test(k) ? parseInt(k) : -1 )) + 1 ] = value;
                        }
                        else
                        {
                            ( obj[key] = [ obj[key] ]).push( value );
                        }
                    }
                    else
                    {
                        obj[key] = value;
                    }
                }
            }
        }});

        return query;
    }
});

module.exports = class Querystring
{
    static get Query(){ return Query }

    static stringify( data )
    {
        return Expand( data ).join('&');
    }

    static parse( querystring, options = {})
    {
        let data = new Querystring.Query(), value, pair, last_pair = 0;

        do
        {
            pair = querystring.indexOf( sep, last_pair ); if( pair === -1 ){ pair = querystring.length; }

            if( pair - last_pair > 1 )
            {
                if( ~( value = querystring.indexOf( eq, last_pair )) && value < pair )
                {
                    data.assign
                    ( 
                        decodeURIComponent( querystring.substring( last_pair, value ).replace(/\+/g, ' ' )),
                        decodeURIComponent( querystring.substring( value + 1, pair ).replace(/\+/g, ' ' )),
                        options.types
                    );
                }
                else
                {
                    data.assign( decodeURIComponent( querystring.substring( last_pair, pair ).replace(/\+/g, ' ' )), null );
                }
            }

            last_pair = pair + 1;
        }
        while( last_pair < querystring.length );

        return data;
    }

    static parseCookies( cookiestring )
    {
        let cookies = {}, key, value, pair, last_pair = 0;

        if( cookiestring )
        {
            do
            {
                pair = cookiestring.indexOf( del, last_pair ); if( pair === -1 ){ pair = cookiestring.length; }

                if( pair - last_pair > 1 )
                {
                    if( ~( value = cookiestring.indexOf( eq, last_pair )) && value < pair )
                    {
                        key = decodeURIComponent( cookiestring.substring( last_pair, value ).trim() );
                        value = decodeURIComponent( cookiestring.substring( value + 1, pair ).trim() );

                        cookies[key] = value;
                    }
                }

                last_pair = pair + 1;
            }
            while( last_pair < cookiestring.length );
        }

        return cookies;
    }
}
