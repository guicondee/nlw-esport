import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
 import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes'
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string'


const app = express()

app.use(cors())
app.use(express.json()) 

const prisma = new PrismaClient({
  log: ['query']
})

//HTTP methods / API RESTful / HTTP codes

app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        }
      }
    }
  })

  return response.json(games)
})
// type BodyProps = {
//   "name": string,
// 	"yearsPlaying": number,
// 	"discord": string,
// 	"weekDays": number[],
// 	"hourStart": string,
// 	"hourEnd": string,
// 	"useVoiceChannel": true 
// }

//ROTA QUE DEU BUG - solicitando chave restrita
app.post('/games/:id/ads', async (request, response) => {
  const gameId =  request.params.id;
  const body = request.body;

  const clear = await prisma.ad.create({
    data: {
      gameId: gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),  
      useVoiceChannel: body.useVoiceChannel,
    }
  })

  return response.status(201).json(clear)
})


app.get('/games/:id/ads', async (request, response) => {
   const gameId = request.params.id;

   const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId: gameId
    },
    orderBy: {
      createdAt: 'desc',
    }
   })

  return response.json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: convertMinutesToHourString(ad.hourStart),
      hourEnd: convertMinutesToHourString(ad.hourEnd)
    }
  }))
})

app.get('/ads/:id/discord', async (request, response) => {
   const adId = request.params.id;

   const Find = await prisma.ad.findUniqueOrThrow({
    select:{
      discord: true,
    },
    where: {
      id: adId,
    }
   })
  
  return response.json({
    discord: Find.discord,
  })
})

app.listen(3333)
