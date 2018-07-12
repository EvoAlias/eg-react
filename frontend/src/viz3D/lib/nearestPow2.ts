export function nearestPow2( aSize: number ): number {
    return Math.pow( 2, Math.ceil( Math.log( aSize ) / Math.log( 2 ) ) ); 
}