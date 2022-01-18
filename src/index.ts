import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event))
})

async function handleEvent(event): Promise<Response> {
    const { request, response } = event
  const init = {
    headers: {
      "content-type": "application/json",
    },
  }


const { searchParams } = new URL(request.url)    
  let lat = searchParams.get('lat')
    let lng = searchParams.get('lng')
    let vaccineType = searchParams.get('vaccineType')
     let offset = searchParams.get('offset') || 0
      let state_code = searchParams.get('state_code')
       let lga_code = searchParams.get('lga_code')
        let facility_type = searchParams.get('facility_type')


if (!lng || !lat) return new Response(JSON.stringify({ error: 'Lat and Lng is required' }), init);
    console.log('passed here');
    
    const conditions = [];

    if (state_code) conditions.push(`state_code='${state_code}'`);
    if (lga_code) conditions.push(`lga_code='${lga_code}'`);
    if (vaccineType) {
      if (vaccineType === 'covid') conditions.push("cce_available=True");
      else conditions.push("cce_available is not True");
    } 
    if (facility_type) conditions.push(`category='${facility_type}'`);

    let whereStatement = '';
    const filteredConditions = conditions.filter(c => c);

    if (filteredConditions.length > 0) {
      whereStatement = `WHERE ${filteredConditions.join(' AND ')}`
    }



const result = await prisma.$queryRawUnsafe(
  `
      select *, 
      ST_DistanceSphere(ST_MakePoint(${lng}, ${lat}), ST_MakePoint(longitude, latitude)) AS distance
      FROM public.facilities
       ${whereStatement}
      ORDER BY distance ASC
      OFFSET ${offset}
      LIMIT 20;`)

  return new Response(JSON.stringify(result), init)
}